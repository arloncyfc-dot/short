<?php
/**
 * =====================================================
 * LINKPENDEK URL SHORTENER - API Autentikasi
 * =====================================================
 * File: auth.php
 * Endpoint: POST /api/auth.php
 * 
 * Actions:
 * - register: Daftar user baru
 * - login: Login user
 * - profile: Get profile user (butuh token)
 * - logout: Logout user
 * =====================================================
 */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'register':
        register();
        break;
    case 'login':
        login();
        break;
    case 'profile':
        getProfile();
        break;
    case 'logout':
        logout();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Action tidak valid'], 400);
}

/**
 * Register pengguna baru
 */
function register() {
    $input = getJsonInput();
    
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';
    
    // Validasi
    if (empty($name) || empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Semua field harus diisi'], 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'Format email tidak valid'], 400);
    }
    
    if (strlen($password) < 6) {
        jsonResponse(['success' => false, 'message' => 'Password minimal 6 karakter'], 400);
    }
    
    if ($password !== $confirmPassword) {
        jsonResponse(['success' => false, 'message' => 'Password tidak cocok'], 400);
    }
    
    $db = getDB();
    
    // Cek email sudah terdaftar
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Email sudah terdaftar'], 409);
    }
    
    // Generate API key
    $apiKey = 'lp_' . bin2hex(random_bytes(16));
    
    // Insert user baru
    $stmt = $db->prepare("
        INSERT INTO users (name, email, password, plan, api_key) 
        VALUES (?, ?, ?, 'free', ?)
    ");
    
    $hashedPassword = hashPassword($password);
    $stmt->execute([$name, $email, $hashedPassword, $apiKey]);
    
    $userId = $db->lastInsertId();
    
    // Generate token
    $token = base64_encode($userId . ':' . time() . ':' . APP_SECRET);
    
    jsonResponse([
        'success' => true,
        'message' => 'Registrasi berhasil',
        'data' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'plan' => 'free',
            'token' => $token,
            'api_key' => $apiKey,
        ]
    ], 201);
}

/**
 * Login pengguna
 */
function login() {
    $input = getJsonInput();
    
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Email dan password harus diisi'], 400);
    }
    
    $db = getDB();
    
    // Cari user berdasarkan email
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !verifyPassword($password, $user['password'])) {
        jsonResponse(['success' => false, 'message' => 'Email atau password salah'], 401);
    }
    
    // Cek apakah paket sudah expired
    if ($user['plan'] !== 'free' && $user['plan_expired_at']) {
        if (strtotime($user['plan_expired_at']) < time()) {
            // Downgrade ke free
            $stmt = $db->prepare("UPDATE users SET plan = 'free' WHERE id = ?");
            $stmt->execute([$user['id']]);
            $user['plan'] = 'free';
        }
    }
    
    // Generate token
    $token = base64_encode($user['id'] . ':' . time() . ':' . APP_SECRET);
    
    jsonResponse([
        'success' => true,
        'message' => 'Login berhasil',
        'data' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'plan' => $user['plan'],
            'token' => $token,
            'api_key' => $user['api_key'],
        ]
    ]);
}

/**
 * Get profile user (butuh token)
 */
function getProfile() {
    $user = authenticateUser();
    
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    
    $db = getDB();
    
    // Hitung jumlah link
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM urls WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $totalLinks = $stmt->fetch()['total'];
    
    // Hitung total clicks
    $stmt = $db->prepare("
        SELECT COALESCE(SUM(u.clicks), 0) as total_clicks 
        FROM urls u WHERE u.user_id = ?
    ");
    $stmt->execute([$user['id']]);
    $totalClicks = $stmt->fetch()['total_clicks'];
    
    jsonResponse([
        'success' => true,
        'data' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'plan' => $user['plan'],
            'total_links' => (int)$totalLinks,
            'total_clicks' => (int)$totalClicks,
            'api_key' => $user['api_key'],
            'created_at' => $user['created_at'],
        ]
    ]);
}

/**
 * Logout
 */
function logout() {
    jsonResponse(['success' => true, 'message' => 'Logout berhasil']);
}

/**
 * Autentikasi user dari token
 */
function authenticateUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($authHeader)) {
        return null;
    }
    
    // Bearer token
    $token = str_replace('Bearer ', '', $authHeader);
    
    // Decode token
    $decoded = base64_decode($token);
    if (!$decoded) return null;
    
    $parts = explode(':', $decoded);
    if (count($parts) !== 3) return null;
    
    [$userId, $timestamp, $secret] = $parts;
    
    // Verifikasi secret
    if ($secret !== APP_SECRET) return null;
    
    // Cek token expired (24 jam)
    if ((time() - $timestamp) > JWT_EXPIRY) return null;
    
    // Get user dari database
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$userId]);
    
    return $stmt->fetch();
}
