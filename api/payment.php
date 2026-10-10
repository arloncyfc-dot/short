<?php
/**
 * =====================================================
 * LINKPENDEK URL SHORTENER - API Pembayaran & Langganan
 * =====================================================
 * File: payment.php
 * Endpoint: POST /api/payment.php
 * 
 * Actions:
 * - plans: Get daftar paket
 * - subscribe: Subscribe ke paket
 * - cancel: Cancel subscription
 * - history: Get riwayat pembayaran
 * - webhook: Handle webhook dari payment gateway
 * =====================================================
 */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'plans':
        getPlans();
        break;
    case 'subscribe':
        subscribe();
        break;
    case 'cancel':
        cancelSubscription();
        break;
    case 'history':
        getPaymentHistory();
        break;
    case 'webhook':
        handleWebhook();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Action tidak valid'], 400);
}

/**
 * Get daftar paket
 */
function getPlans() {
    $db = getDB();
    
    $stmt = $db->prepare("SELECT * FROM plans WHERE is_active = 1 ORDER BY price_monthly ASC");
    $stmt->execute();
    $plans = $stmt->fetchAll();
    
    jsonResponse([
        'success' => true,
        'data' => $plans
    ]);
}

/**
 * Subscribe ke paket
 */
function subscribe() {
    $user = authenticateUser();
    
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    
    $input = getJsonInput();
    $planSlug = $input['plan'] ?? '';
    $paymentMethod = $input['payment_method'] ?? '';
    $duration = $input['duration'] ?? 'monthly'; // monthly atau yearly
    
    if (empty($planSlug)) {
        jsonResponse(['success' => false, 'message' => 'Paket tidak valid'], 400);
    }
    
    $db = getDB();
    
    // Get plan info
    $stmt = $db->prepare("SELECT * FROM plans WHERE slug = ? AND is_active = 1");
    $stmt->execute([$planSlug]);
    $plan = $stmt->fetch();
    
    if (!$plan) {
        jsonResponse(['success' => false, 'message' => 'Paket tidak ditemukan'], 404);
    }
    
    // Hitung harga
    $amount = $duration === 'yearly' ? $plan['price_yearly'] : $plan['price_monthly'];
    
    // Jika free, langsung upgrade
    if ($planSlug === 'free') {
        $stmt = $db->prepare("UPDATE users SET plan = 'free', plan_expired_at = NULL WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        jsonResponse([
            'success' => true,
            'message' => 'Berhasil downgrade ke paket Gratis',
            'data' => ['plan' => 'free']
        ]);
    }
    
    // Buat record pembayaran
    $stmt = $db->prepare("
        INSERT INTO payments (user_id, plan_id, amount, payment_method, status) 
        VALUES (?, ?, ?, ?, 'pending')
    ");
    $stmt->execute([$user['id'], $plan['id'], $amount, $paymentMethod]);
    
    $paymentId = $db->lastInsertId();
    
    // Generate transaction ID
    $transactionId = 'TRX-' . date('Ymd') . '-' . str_pad($paymentId, 6, '0', STR_PAD_LEFT);
    
    $stmt = $db->prepare("UPDATE payments SET transaction_id = ? WHERE id = ?");
    $stmt->execute([$transactionId, $paymentId]);
    
    // Simulasi payment gateway (di production, integrasikan dengan Midtrans/Xendit/dll)
    $paymentUrl = APP_URL . '/payment/' . $transactionId;
    
    jsonResponse([
        'success' => true,
        'message' => 'Pembayaran dibuat. Silakan selesaikan pembayaran.',
        'data' => [
            'payment_id' => $paymentId,
            'transaction_id' => $transactionId,
            'amount' => $amount,
            'payment_url' => $paymentUrl,
            'plan' => $plan['name'],
            'duration' => $duration,
        ]
    ], 201);
}

/**
 * Cancel subscription
 */
function cancelSubscription() {
    $user = authenticateUser();
    
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    
    $db = getDB();
    
    // Downgrade ke free
    $stmt = $db->prepare("UPDATE users SET plan = 'free', plan_expired_at = NULL WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    jsonResponse([
        'success' => true,
        'message' => 'Langganan berhasil dibatalkan. Anda akan menggunakan paket Gratis.'
    ]);
}

/**
 * Get payment history
 */
function getPaymentHistory() {
    $user = authenticateUser();
    
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT p.*, pl.name as plan_name 
        FROM payments p 
        JOIN plans pl ON p.plan_id = pl.id 
        WHERE p.user_id = ? 
        ORDER BY p.created_at DESC
    ");
    $stmt->execute([$user['id']]);
    $payments = $stmt->fetchAll();
    
    jsonResponse([
        'success' => true,
        'data' => $payments
    ]);
}

/**
 * Handle webhook dari payment gateway
 * (Midtrans, Xendit, dll)
 */
function handleWebhook() {
    $input = getJsonInput();
    
    // Verifikasi signature (sesuaikan dengan payment gateway)
    // $signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
    // if (!verifyWebhookSignature($signature, $input)) {
    //     jsonResponse(['success' => false, 'message' => 'Invalid signature'], 403);
    // }
    
    $transactionId = $input['transaction_id'] ?? '';
    $status = $input['status'] ?? ''; // success, pending, failed
    
    if (empty($transactionId)) {
        jsonResponse(['success' => false, 'message' => 'Transaction ID required'], 400);
    }
    
    $db = getDB();
    
    // Get payment
    $stmt = $db->prepare("SELECT * FROM payments WHERE transaction_id = ?");
    $stmt->execute([$transactionId]);
    $payment = $stmt->fetch();
    
    if (!$payment) {
        jsonResponse(['success' => false, 'message' => 'Payment not found'], 404);
    }
    
    if ($status === 'success') {
        // Update payment status
        $stmt = $db->prepare("
            UPDATE payments SET status = 'success', paid_at = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$payment['id']]);
        
        // Get plan info
        $stmt = $db->prepare("SELECT * FROM plans WHERE id = ?");
        $stmt->execute([$payment['plan_id']]);
        $plan = $stmt->fetch();
        
        // Update user plan
        $expiryDays = $plan['slug'] === 'premium' ? 365 : 365; // 1 tahun
        $expiredAt = date('Y-m-d H:i:s', strtotime("+{$expiryDays} days"));
        
        $stmt = $db->prepare("
            UPDATE users SET plan = ?, plan_expired_at = ? 
            WHERE id = ?
        ");
        $stmt->execute([$plan['slug'], $expiredAt, $payment['user_id']]);
    }
    
    jsonResponse(['success' => true, 'message' => 'Webhook processed']);
}

/**
 * Autentikasi user
 */
function authenticateUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader)) return null;
    
    $token = str_replace('Bearer ', '', $authHeader);
    $decoded = base64_decode($token);
    if (!$decoded) return null;
    
    $parts = explode(':', $decoded);
    if (count($parts) !== 3) return null;
    
    [$userId, $timestamp, $secret] = $parts;
    
    if ($secret !== APP_SECRET) return null;
    if ((time() - $timestamp) > JWT_EXPIRY) return null;
    
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$userId]);
    
    return $stmt->fetch();
}
