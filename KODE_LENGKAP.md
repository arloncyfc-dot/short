# 📦 KODE LENGKAP - LINKPENDEK URL SHORTENER
# File ini berisi SEMUA kode lengkap yang siap di-copy

---

## 📂 FILE 1: database/schema.sql

```sql
-- =====================================================
-- LINKPENDEK URL SHORTENER - DATABASE SCHEMA
-- Versi: 1.0.0
-- =====================================================

CREATE DATABASE IF NOT EXISTS linkpendek_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE linkpendek_db;

-- TABEL 1: users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  plan ENUM('free', 'premium', 'business') DEFAULT 'free',
  plan_expired_at DATETIME DEFAULT NULL,
  api_key VARCHAR(64) DEFAULT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_api_key (api_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABEL 2: urls
CREATE TABLE urls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  short_code VARCHAR(10) NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  custom_alias VARCHAR(50) DEFAULT NULL UNIQUE,
  title VARCHAR(255) DEFAULT NULL,
  clicks INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  expires_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_short_code (short_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABEL 3: clicks
CREATE TABLE clicks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  url_id INT NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  referrer TEXT DEFAULT NULL,
  device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT NULL,
  browser VARCHAR(50) DEFAULT NULL,
  os VARCHAR(50) DEFAULT NULL,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE,
  INDEX idx_url_id (url_id),
  INDEX idx_clicked_at (clicked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABEL 4: plans
CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_links INT DEFAULT 50,
  custom_alias TINYINT(1) DEFAULT 0,
  qr_code TINYINT(1) DEFAULT 0,
  analytics TINYINT(1) DEFAULT 0,
  api_access TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABEL 5: payments
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT NULL,
  transaction_id VARCHAR(100) DEFAULT NULL,
  status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
  paid_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABEL 6: settings
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DATA AWAL: Plans
INSERT INTO plans (name, slug, price_monthly, price_yearly, max_links, custom_alias, qr_code, analytics, api_access) VALUES
('Gratis', 'free', 0.00, 0.00, 50, 0, 0, 1, 0),
('Premium', 'premium', 49000.00, 490000.00, 500, 1, 1, 1, 0),
('Bisnis', 'business', 149000.00, 1490000.00, 99999, 1, 1, 1, 1);

-- DATA AWAL: Settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('site_name', 'LinkPendek', 'Nama situs'),
('short_domain', 'lnk.pd', 'Domain short link'),
('free_link_limit', '50', 'Batas link gratis');

-- DATA AWAL: Admin User (password: admin123)
INSERT INTO users (name, email, password, plan, api_key) VALUES
('Administrator', 'admin@linkpendek.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2u6S1OxQKye', 'business', 'lp_admin_key_2024');
```

---

## 📂 FILE 2: api/config.php

```php
<?php
/**
 * Konfigurasi Database - LinkPendek
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'linkpendek_db');
define('DB_USER', 'root');
define('DB_PASS', ''); // GANTI DENGAN PASSWORD ANDA
define('DB_CHARSET', 'utf8mb4');

define('APP_NAME', 'LinkPendek');
define('APP_URL', 'http://localhost:8000');
define('SHORT_DOMAIN', 'lnk.pd');
define('APP_SECRET', 'change-this-to-random-string-32-chars');
define('JWT_SECRET', 'change-this-jwt-secret');
define('JWT_EXPIRY', 86400);

$PLAN_LIMITS = [
    'free' => ['max_links' => 50, 'custom_alias' => false, 'link_expiry_days' => 30],
    'premium' => ['max_links' => 500, 'custom_alias' => true, 'link_expiry_days' => 365],
    'business' => ['max_links' => 99999, 'custom_alias' => true, 'link_expiry_days' => 0],
];

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['success' => false, 'message' => 'Koneksi database gagal: ' . $e->getMessage()]));
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }
}

function getDB() {
    return Database::getInstance()->getConnection();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function generateRandomString($length = 6) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $result = '';
    for ($i = 0; $i < $length; $i++) {
        $result .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $result;
}

function generateShortCode($length = 6) {
    $db = getDB();
    do {
        $code = generateRandomString($length);
        $stmt = $db->prepare("SELECT id FROM urls WHERE short_code = ?");
        $stmt->execute([$code]);
    } while ($stmt->fetch());
    return $code;
}

function isValidUrl($url) {
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function getClientIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function getUserAgent() {
    return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
}

function detectDeviceType($userAgent) {
    if (preg_match('/Mobile|Android|iPhone/i', $userAgent)) return 'mobile';
    if (preg_match('/Tablet|iPad/i', $userAgent)) return 'tablet';
    return 'desktop';
}

function detectBrowser($userAgent) {
    if (preg_match('/Chrome/i', $userAgent)) return 'Chrome';
    if (preg_match('/Firefox/i', $userAgent)) return 'Firefox';
    if (preg_match('/Safari/i', $userAgent)) return 'Safari';
    if (preg_match('/Edge/i', $userAgent)) return 'Edge';
    return 'Other';
}

function detectOS($userAgent) {
    if (preg_match('/Windows/i', $userAgent)) return 'Windows';
    if (preg_match('/Mac/i', $userAgent)) return 'macOS';
    if (preg_match('/Linux/i', $userAgent)) return 'Linux';
    if (preg_match('/Android/i', $userAgent)) return 'Android';
    if (preg_match('/iOS|iPhone|iPad/i', $userAgent)) return 'iOS';
    return 'Other';
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit();
}

function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}
```

---

## 📂 FILE 3: api/auth.php

```php
<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'register': register(); break;
    case 'login': login(); break;
    case 'profile': getProfile(); break;
    case 'logout': logout(); break;
    default: jsonResponse(['success' => false, 'message' => 'Action tidak valid'], 400);
}

function register() {
    $input = getJsonInput();
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';

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
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Email sudah terdaftar'], 409);
    }

    $apiKey = 'lp_' . bin2hex(random_bytes(16));
    $stmt = $db->prepare("INSERT INTO users (name, email, password, plan, api_key) VALUES (?, ?, ?, 'free', ?)");
    $hashedPassword = hashPassword($password);
    $stmt->execute([$name, $email, $hashedPassword, $apiKey]);

    $userId = $db->lastInsertId();
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

function login() {
    $input = getJsonInput();
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Email dan password harus diisi'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !verifyPassword($password, $user['password'])) {
        jsonResponse(['success' => false, 'message' => 'Email atau password salah'], 401);
    }

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

function getProfile() {
    $user = authenticateUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM urls WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $totalLinks = $stmt->fetch()['total'];

    $stmt = $db->prepare("SELECT COALESCE(SUM(clicks), 0) as total_clicks FROM urls WHERE user_id = ?");
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
        ]
    ]);
}

function logout() {
    jsonResponse(['success' => true, 'message' => 'Logout berhasil']);
}

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
```

---

## 📂 FILE 4: api/urls.php

```php
<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'shorten': shortenUrl(); break;
    case 'list': listUrls(); break;
    case 'delete': deleteUrl(); break;
    case 'stats': getUrlStats(); break;
    case 'redirect': redirectUrl(); break;
    default: jsonResponse(['success' => false, 'message' => 'Action tidak valid'], 400);
}

function shortenUrl() {
    $input = getJsonInput();
    $user = authenticateUser();
    $originalUrl = trim($input['url'] ?? '');
    $customAlias = trim($input['alias'] ?? '');
    $title = trim($input['title'] ?? '');

    if (empty($originalUrl)) {
        jsonResponse(['success' => false, 'message' => 'URL tidak boleh kosong'], 400);
    }

    if (!isValidUrl($originalUrl)) {
        jsonResponse(['success' => false, 'message' => 'Format URL tidak valid'], 400);
    }

    $db = getDB();
    $userId = $user ? $user['id'] : null;
    $userPlan = $user ? $user['plan'] : 'free';

    if ($userId) {
        global $PLAN_LIMITS;
        $limits = $PLAN_LIMITS[$userPlan];

        $stmt = $db->prepare("SELECT COUNT(*) as total FROM urls WHERE user_id = ? AND is_active = 1");
        $stmt->execute([$userId]);
        $currentLinks = $stmt->fetch()['total'];

        if ($currentLinks >= $limits['max_links']) {
            jsonResponse(['success' => false, 'message' => 'Limit link tercapai'], 403);
        }

        if (!empty($customAlias)) {
            if (!$limits['custom_alias']) {
                jsonResponse(['success' => false, 'message' => 'Custom alias hanya untuk Premium/Bisnis'], 403);
            }
            $stmt = $db->prepare("SELECT id FROM urls WHERE custom_alias = ? OR short_code = ?");
            $stmt->execute([$customAlias, $customAlias]);
            if ($stmt->fetch()) {
                jsonResponse(['success' => false, 'message' => 'Alias sudah digunakan'], 409);
            }
            $shortCode = $customAlias;
        } else {
            $shortCode = generateShortCode();
        }

        $expiryDays = $limits['link_expiry_days'];
        $expiresAt = $expiryDays > 0 ? date('Y-m-d H:i:s', strtotime("+{$expiryDays} days")) : null;
    } else {
        $shortCode = generateShortCode();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    }

    $stmt = $db->prepare("INSERT INTO urls (user_id, short_code, original_url, custom_alias, title, expires_at) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $shortCode, $originalUrl, !empty($customAlias) ? $customAlias : null, !empty($title) ? $title : null, $expiresAt]);

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
        ]
    ], 201);
}

function listUrls() {
    $user = authenticateUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;

    $stmt = $db->prepare("SELECT COUNT(*) as total FROM urls WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $total = $stmt->fetch()['total'];

    $stmt = $db->prepare("SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute([$user['id'], $limit, $offset]);
    $urls = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'data' => [
            'urls' => $urls,
            'pagination' => ['total' => (int)$total, 'page' => $page, 'limit' => $limit]
        ]
    ]);
}

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
    $stmt = $db->prepare("SELECT id FROM urls WHERE id = ? AND user_id = ?");
    $stmt->execute([$urlId, $user['id']]);

    if (!$stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'URL tidak ditemukan'], 404);
    }

    $stmt = $db->prepare("DELETE FROM urls WHERE id = ? AND user_id = ?");
    $stmt->execute([$urlId, $user['id']]);

    jsonResponse(['success' => true, 'message' => 'URL berhasil dihapus']);
}

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
    $stmt = $db->prepare("SELECT * FROM urls WHERE short_code = ? AND user_id = ?");
    $stmt->execute([$shortCode, $user['id']]);
    $url = $stmt->fetch();

    if (!$url) {
        jsonResponse(['success' => false, 'message' => 'URL tidak ditemukan'], 404);
    }

    $stmt = $db->prepare("SELECT COUNT(*) as total_clicks, DATE(clicked_at) as date FROM clicks WHERE url_id = ? GROUP BY DATE(clicked_at) ORDER BY date DESC LIMIT 30");
    $stmt->execute([$url['id']]);
    $clicksByDate = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'data' => [
            'url' => $url,
            'analytics' => ['clicks_by_date' => $clicksByDate]
        ]
    ]);
}

function redirectUrl() {
    $shortCode = $_GET['code'] ?? '';
    if (empty($shortCode)) {
        http_response_code(404);
        echo 'URL tidak ditemukan';
        exit();
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM urls WHERE short_code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())");
    $stmt->execute([$shortCode]);
    $url = $stmt->fetch();

    if (!$url) {
        http_response_code(404);
        echo 'URL tidak ditemukan atau sudah kadaluarsa';
        exit();
    }

    $userAgent = getUserAgent();
    $stmt = $db->prepare("INSERT INTO clicks (url_id, ip_address, user_agent, device_type, browser, os) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$url['id'], getClientIP(), $userAgent, detectDeviceType($userAgent), detectBrowser($userAgent), detectOS($userAgent)]);

    $stmt = $db->prepare("UPDATE urls SET clicks = clicks + 1 WHERE id = ?");
    $stmt->execute([$url['id']]);

    header('Location: ' . $url['original_url'], true, 301);
    exit();
}

function authenticateUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $apiKey = $_GET['api_key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? '';

    $db = getDB();

    if (!empty($apiKey)) {
        $stmt = $db->prepare("SELECT * FROM users WHERE api_key = ? AND is_active = 1");
        $stmt->execute([$apiKey]);
        return $stmt->fetch();
    }

    if (empty($authHeader)) return null;

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
```

---

## 📂 FILE 5: api/payment.php

```php
<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'plans': getPlans(); break;
    case 'subscribe': subscribe(); break;
    case 'cancel': cancelSubscription(); break;
    case 'history': getPaymentHistory(); break;
    default: jsonResponse(['success' => false, 'message' => 'Action tidak valid'], 400);
}

function getPlans() {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM plans WHERE is_active = 1 ORDER BY price_monthly ASC");
    $stmt->execute();
    $plans = $stmt->fetchAll();
    jsonResponse(['success' => true, 'data' => $plans]);
}

function subscribe() {
    $user = authenticateUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    $input = getJsonInput();
    $planSlug = $input['plan'] ?? '';
    $paymentMethod = $input['payment_method'] ?? '';
    $duration = $input['duration'] ?? 'monthly';

    if (empty($planSlug)) {
        jsonResponse(['success' => false, 'message' => 'Paket tidak valid'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM plans WHERE slug = ? AND is_active = 1");
    $stmt->execute([$planSlug]);
    $plan = $stmt->fetch();

    if (!$plan) {
        jsonResponse(['success' => false, 'message' => 'Paket tidak ditemukan'], 404);
    }

    $amount = $duration === 'yearly' ? $plan['price_yearly'] : $plan['price_monthly'];

    if ($planSlug === 'free') {
        $stmt = $db->prepare("UPDATE users SET plan = 'free', plan_expired_at = NULL WHERE id = ?");
        $stmt->execute([$user['id']]);
        jsonResponse(['success' => true, 'message' => 'Berhasil downgrade ke paket Gratis']);
    }

    $stmt = $db->prepare("INSERT INTO payments (user_id, plan_id, amount, payment_method, status) VALUES (?, ?, ?, ?, 'pending')");
    $stmt->execute([$user['id'], $plan['id'], $amount, $paymentMethod]);
    $paymentId = $db->lastInsertId();

    $transactionId = 'TRX-' . date('Ymd') . '-' . str_pad($paymentId, 6, '0', STR_PAD_LEFT);
    $stmt = $db->prepare("UPDATE payments SET transaction_id = ? WHERE id = ?");
    $stmt->execute([$transactionId, $paymentId]);

    jsonResponse([
        'success' => true,
        'message' => 'Pembayaran dibuat',
        'data' => [
            'payment_id' => $paymentId,
            'transaction_id' => $transactionId,
            'amount' => $amount,
            'plan' => $plan['name'],
        ]
    ], 201);
}

function cancelSubscription() {
    $user = authenticateUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $stmt = $db->prepare("UPDATE users SET plan = 'free', plan_expired_at = NULL WHERE id = ?");
    $stmt->execute([$user['id']]);

    jsonResponse(['success' => true, 'message' => 'Langganan berhasil dibatalkan']);
}

function getPaymentHistory() {
    $user = authenticateUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT p.*, pl.name as plan_name FROM payments p JOIN plans pl ON p.plan_id = pl.id WHERE p.user_id = ? ORDER BY p.created_at DESC");
    $stmt->execute([$user['id']]);
    $payments = $stmt->fetchAll();

    jsonResponse(['success' => true, 'data' => $payments]);
}

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
```

---

## 📂 FILE 6: public/.htaccess

```apache
RewriteEngine On
RewriteBase /

# Redirect short URLs
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/admin/
RewriteRule ^([a-zA-Z0-9]{4,10})$ api/urls.php?action=redirect&code=$1 [L,QSA]

# Security
<FilesMatch "\.(sql|log|env|ini|conf)$">
    Order allow,deny
    Deny from all
</FilesMatch>

Options -Indexes

<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

---

## 📂 FILE 7: .env.example

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=linkpendek_db
DB_USER=root
DB_PASS=
DB_CHARSET=utf8mb4

# Application
APP_NAME=LinkPendek
APP_URL=http://localhost:8000
APP_ENV=development
APP_DEBUG=true
APP_SECRET=change-this-to-random-string-at-least-32-chars

# Short Domain
SHORT_DOMAIN=lnk.pd

# JWT
JWT_SECRET=change-this-to-another-random-string
JWT_EXPIRY=86400

# Payment Gateway
PAYMENT_GATEWAY=midtrans
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false
```

---

## 🎉 SELESAI!

Semua kode lengkap sudah tersedia di atas. Copy-paste setiap file ke project Anda.

**Cara Install:**
1. Copy semua file sesuai struktur folder
2. Import `database/schema.sql` ke MySQL
3. Edit `api/config.php` (ganti DB_PASS, APP_SECRET)
4. Jalankan `npm install`
5. Jalankan `npm run dev`
6. Akses http://localhost:5173

**Akun Default:**
- Email: admin@linkpendek.id
- Password: admin123

**Happy Coding! 🚀**
