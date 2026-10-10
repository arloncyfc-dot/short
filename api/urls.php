<?php
/**
 * =====================================================
 * LINKPENDEK URL SHORTENER - API URL Shortener
 * =====================================================
 * File: urls.php
 * Endpoint: /api/urls.php
 * 
 * Actions:
 * - shorten: Persingkat URL
 * - list: List URL user (butuh token)
 * - delete: Hapus URL (butuh token)
 * - stats: Get statistik URL (butuh token)
 * - redirect: Redirect short link (public)
 * =====================================================
 */

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'shorten':
        shortenUrl();
        break;
    case 'list':
        listUrls();
        break;
    case 'delete':
        deleteUrl();
        break;
    case 'stats':
        getUrlStats();
        break;
    case 'redirect':
        redirectUrl();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Action tidak valid'], 400);
}

/**
 * Persingkat URL
 */
function shortenUrl() {
    $input = getJsonInput();
    $user = authenticateUser();
    
    $originalUrl = trim($input['url'] ?? '');
    $customAlias = trim($input['alias'] ?? '');
    $title = trim($input['title'] ?? '');
    
    // Validasi URL
    if (empty($originalUrl)) {
        jsonResponse(['success' => false, 'message' => 'URL tidak boleh kosong'], 400);
    }
    
    if (!isValidUrl($originalUrl)) {
        jsonResponse(['success' => false, 'message' => 'Format URL tidak valid'], 400);
    }
    
    $db = getDB();
    $userId = $user ? $user['id'] : null;
    $userPlan = $user ? $user['plan'] : 'free';
    
    // Cek limit untuk user yang login
    if ($userId) {
        global $PLAN_LIMITS;
        $limits = $PLAN_LIMITS[$userPlan];
        
        // Hitung jumlah link saat ini
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM urls WHERE user_id = ? AND is_active = 1");
        $stmt->execute([$userId]);
        $currentLinks = $stmt->fetch()['total'];
        
        if ($currentLinks >= $limits['max_links']) {
            jsonResponse([
                'success' => false, 
                'message' => 'Limit link tercapai. Upgrade paket Anda untuk menambah limit.'
            ], 403);
        }
        
        // Cek custom alias
        if (!empty($customAlias)) {
            if (!$limits['custom_alias']) {
                jsonResponse([
                    'success' => false, 
                    'message' => 'Custom alias hanya tersedia untuk paket Premium/Bisnis'
                ], 403);
            }
            
            // Cek alias sudah digunakan
            $stmt = $db->prepare("SELECT id FROM urls WHERE custom_alias = ? OR short_code = ?");
            $stmt->execute([$customAlias, $customAlias]);
            if ($stmt->fetch()) {
                jsonResponse(['success' => false, 'message' => 'Alias sudah digunakan'], 409);
            }
            
            $shortCode = $customAlias;
        } else {
            $shortCode = generateShortCode();
        }
        
        // Hitung expired date
        $expiryDays = $limits['link_expiry_days'];
        $expiresAt = $expiryDays > 0 ? date('Y-m-d H:i:s', strtotime("+{$expiryDays} days")) : null;
        
    } else {
        // Guest user - generate short code
        $shortCode = generateShortCode();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days')); // 30 hari untuk guest
    }
    
    // Insert URL baru
    $stmt = $db->prepare("
        INSERT INTO urls (user_id, short_code, original_url, custom_alias, title, expires_at) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $userId,
        $shortCode,
        $originalUrl,
        !empty($customAlias) ? $customAlias : null,
        !empty($title) ? $title : null,
        $expiresAt
    ]);
    
    $urlId = $db->lastInsertId();
    $shortUrl = SHORT_DOMAIN . '/' . $shortCode;
    
    jsonResponse([
        'success' => true,
        'message' => 'URL berhasil dipersingkat',
        'data' => [
            'id' => $urlId,
            'short_code' => $shortCode,
            'short_url' => $shortUrl,
            'original_url' => $originalUrl,
            'expires_at' => $expiresAt,
            'created_at' => date('Y-m-d H:i:s'),
        ]
    ], 201);
}

/**
 * List URL user (butuh autentikasi)
 */
function listUrls() {
    $user = authenticateUser();
    
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    
    $db = getDB();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;
    
    // Get total count
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM urls WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $total = $stmt->fetch()['total'];
    
    // Get URLs
    $stmt = $db->prepare("
        SELECT id, short_code, original_url, custom_alias, title, clicks, is_active, expires_at, created_at 
        FROM urls 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$user['id'], $limit, $offset]);
    $urls = $stmt->fetchAll();
    
    // Format URLs
    $formattedUrls = array_map(function($url) {
        return [
            'id' => $url['id'],
            'short_code' => $url['short_code'],
            'short_url' => SHORT_DOMAIN . '/' . $url['short_code'],
            'original_url' => $url['original_url'],
            'custom_alias' => $url['custom_alias'],
            'title' => $url['title'],
            'clicks' => (int)$url['clicks'],
            'is_active' => (bool)$url['is_active'],
            'expires_at' => $url['expires_at'],
            'created_at' => $url['created_at'],
        ];
    }, $urls);
    
    jsonResponse([
        'success' => true,
        'data' => [
            'urls' => $formattedUrls,
            'pagination' => [
                'total' => (int)$total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($total / $limit),
            ]
        ]
    ]);
}

/**
 * Delete URL
 */
function deleteUrl() {
    $user = authenticateUser();
    
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    
    $input = getJsonInput();
    $urlId = (int)($input['id'] ?? 0);
    
    if (!$urlId) {
        jsonResponse(['success' => false, 'message' => 'ID URL tidak valid'], 400);
    }
    
    $db = getDB();
    
    // Cek ownership
    $stmt = $db->prepare("SELECT id FROM urls WHERE id = ? AND user_id = ?");
    $stmt->execute([$urlId, $user['id']]);
    
    if (!$stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'URL tidak ditemukan'], 404);
    }
    
    // Delete URL
    $stmt = $db->prepare("DELETE FROM urls WHERE id = ? AND user_id = ?");
    $stmt->execute([$urlId, $user['id']]);
    
    jsonResponse(['success' => true, 'message' => 'URL berhasil dihapus']);
}

/**
 * Get statistik URL
 */
function getUrlStats() {
    $user = authenticateUser();
    
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }
    
    $shortCode = $_GET['code'] ?? '';
    
    if (empty($shortCode)) {
        jsonResponse(['success' => false, 'message' => 'Short code tidak valid'], 400);
    }
    
    $db = getDB();
    
    // Get URL info
    $stmt = $db->prepare("SELECT * FROM urls WHERE short_code = ? AND user_id = ?");
    $stmt->execute([$shortCode, $user['id']]);
    $url = $stmt->fetch();
    
    if (!$url) {
        jsonResponse(['success' => false, 'message' => 'URL tidak ditemukan'], 404);
    }
    
    // Get clicks data
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total_clicks,
            DATE(clicked_at) as date,
            COUNT(DISTINCT ip_address) as unique_visitors
        FROM clicks 
        WHERE url_id = ?
        GROUP BY DATE(clicked_at)
        ORDER BY date DESC
        LIMIT 30
    ");
    $stmt->execute([$url['id']]);
    $clicksByDate = $stmt->fetchAll();
    
    // Get device stats
    $stmt = $db->prepare("
        SELECT device_type, COUNT(*) as count 
        FROM clicks 
        WHERE url_id = ?
        GROUP BY device_type
    ");
    $stmt->execute([$url['id']]);
    $deviceStats = $stmt->fetchAll();
    
    // Get browser stats
    $stmt = $db->prepare("
        SELECT browser, COUNT(*) as count 
        FROM clicks 
        WHERE url_id = ?
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 5
    ");
    $stmt->execute([$url['id']]);
    $browserStats = $stmt->fetchAll();
    
    jsonResponse([
        'success' => true,
        'data' => [
            'url' => [
                'id' => $url['id'],
                'short_code' => $url['short_code'],
                'short_url' => SHORT_DOMAIN . '/' . $url['short_code'],
                'original_url' => $url['original_url'],
                'total_clicks' => (int)$url['clicks'],
                'created_at' => $url['created_at'],
            ],
            'analytics' => [
                'clicks_by_date' => $clicksByDate,
                'device_stats' => $deviceStats,
                'browser_stats' => $browserStats,
            ]
        ]
    ]);
}

/**
 * Redirect URL (dipanggil saat user mengakses short link)
 */
function redirectUrl() {
    $shortCode = $_GET['code'] ?? '';
    
    if (empty($shortCode)) {
        http_response_code(404);
        echo 'URL tidak ditemukan';
        exit();
    }
    
    $db = getDB();
    
    // Cari URL berdasarkan short_code atau custom_alias
    $stmt = $db->prepare("
        SELECT * FROM urls 
        WHERE (short_code = ? OR custom_alias = ?) 
        AND is_active = 1 
        AND (expires_at IS NULL OR expires_at > NOW())
    ");
    $stmt->execute([$shortCode, $shortCode]);
    $url = $stmt->fetch();
    
    if (!$url) {
        http_response_code(404);
        echo 'URL tidak ditemukan atau sudah kadaluarsa';
        exit();
    }
    
    // Log click
    $userAgent = getUserAgent();
    $stmt = $db->prepare("
        INSERT INTO clicks (url_id, ip_address, user_agent, referrer, device_type, browser, os) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $url['id'],
        getClientIP(),
        $userAgent,
        $_SERVER['HTTP_REFERER'] ?? null,
        detectDeviceType($userAgent),
        detectBrowser($userAgent),
        detectOS($userAgent),
    ]);
    
    // Increment click count
    $stmt = $db->prepare("UPDATE urls SET clicks = clicks + 1 WHERE id = ?");
    $stmt->execute([$url['id']]);
    
    // Redirect
    header('Location: ' . $url['original_url'], true, 301);
    exit();
}

/**
 * Autentikasi user
 */
function authenticateUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    // Cek API key juga
    $apiKey = $_GET['api_key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? '';
    
    $db = getDB();
    
    if (!empty($apiKey)) {
        $stmt = $db->prepare("SELECT * FROM users WHERE api_key = ? AND is_active = 1");
        $stmt->execute([$apiKey]);
        return $stmt->fetch();
    }
    
    if (empty($authHeader)) {
        return null;
    }
    
    $token = str_replace('Bearer ', '', $authHeader);
    $decoded = base64_decode($token);
    if (!$decoded) return null;
    
    $parts = explode(':', $decoded);
    if (count($parts) !== 3) return null;
    
    [$userId, $timestamp, $secret] = $parts;
    
    if ($secret !== APP_SECRET) return null;
    if ((time() - $timestamp) > JWT_EXPIRY) return null;
    
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$userId]);
    
    return $stmt->fetch();
}
