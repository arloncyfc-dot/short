-- =====================================================
-- LINKPENDEK URL SHORTENER - DATABASE SCHEMA
-- Versi: 1.0.0
-- Database: MySQL 5.7+ / MariaDB 10.3+
-- =====================================================

-- Hapus database jika sudah ada (opsional)
-- DROP DATABASE IF EXISTS linkpendek_db;

-- Buat database baru
CREATE DATABASE IF NOT EXISTS linkpendek_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE linkpendek_db;

-- =====================================================
-- TABEL 1: users (Data Pengguna)
-- =====================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
  plan ENUM('free', 'premium', 'business') DEFAULT 'free',
  plan_expired_at DATETIME DEFAULT NULL,
  api_key VARCHAR(64) DEFAULT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_api_key (api_key),
  INDEX idx_plan (plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABEL 2: urls (Link yang Dipersingkat)
-- =====================================================
CREATE TABLE urls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  short_code VARCHAR(10) NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  custom_alias VARCHAR(50) DEFAULT NULL UNIQUE,
  title VARCHAR(255) DEFAULT NULL,
  clicks INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  is_password_protected TINYINT(1) DEFAULT 0,
  password_hash VARCHAR(255) DEFAULT NULL,
  expires_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE INDEX idx_short_code (short_code),
  UNIQUE INDEX idx_custom_alias (custom_alias),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABEL 3: clicks (Log Klik untuk Analitik)
-- =====================================================
CREATE TABLE clicks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  url_id INT NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  referrer TEXT DEFAULT NULL,
  country VARCHAR(2) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT NULL,
  browser VARCHAR(50) DEFAULT NULL,
  os VARCHAR(50) DEFAULT NULL,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE,
  INDEX idx_url_id (url_id),
  INDEX idx_clicked_at (clicked_at),
  INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABEL 4: plans (Paket Langganan)
-- =====================================================
CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_links INT DEFAULT 50,
  max_clicks INT DEFAULT -1,
  custom_alias TINYINT(1) DEFAULT 0,
  qr_code TINYINT(1) DEFAULT 0,
  analytics TINYINT(1) DEFAULT 0,
  api_access TINYINT(1) DEFAULT 0,
  custom_domain TINYINT(1) DEFAULT 0,
  priority_support TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABEL 5: payments (Riwayat Pembayaran)
-- =====================================================
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
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABEL 6: settings (Pengaturan Aplikasi)
-- =====================================================
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATA AWAL: Paket Langganan
-- =====================================================
INSERT INTO plans (name, slug, price_monthly, price_yearly, max_links, custom_alias, qr_code, analytics, api_access, custom_domain, priority_support) VALUES
('Gratis', 'free', 0.00, 0.00, 50, 0, 0, 1, 0, 0, 0),
('Premium', 'premium', 49000.00, 490000.00, 500, 1, 1, 1, 0, 0, 1),
('Bisnis', 'business', 149000.00, 1490000.00, 99999, 1, 1, 1, 1, 1, 1);

-- =====================================================
-- DATA AWAL: Pengaturan Aplikasi
-- =====================================================
INSERT INTO settings (setting_key, setting_value, description) VALUES
('site_name', 'LinkPendek', 'Nama situs'),
('site_url', 'https://linkpendek.id', 'URL situs'),
('short_domain', 'lnk.pd', 'Domain untuk link pendek'),
('default_plan', 'free', 'Paket default untuk pengguna baru'),
('free_link_limit', '50', 'Batas link untuk pengguna gratis'),
('free_link_expiry', '30', 'Masa aktif link gratis (hari)'),
('premium_link_expiry', '365', 'Masa aktif link premium (hari)'),
('business_link_expiry', '0', 'Masa aktif link bisnis (0 = selamanya)'),
('maintenance_mode', '0', 'Mode maintenance (0/1)'),
('registration_enabled', '1', 'Izinkan pendaftaran (0/1)');

-- =====================================================
-- DATA AWAL: User Admin
-- Password: admin123 (sudah di-hash dengan bcrypt)
-- =====================================================
INSERT INTO users (name, email, password, plan, api_key) VALUES
('Administrator', 'admin@linkpendek.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2u6S1OxQKye', 'business', 'lp_admin_api_key_2024');

-- =====================================================
-- STORED PROCEDURE: Cleanup Link Expired
-- =====================================================
DELIMITER //
CREATE PROCEDURE cleanup_expired_links()
BEGIN
  UPDATE urls 
  SET is_active = 0 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND is_active = 1;
END //
DELIMITER ;

-- =====================================================
-- EVENT SCHEDULER: Jalankan cleanup setiap hari
-- =====================================================
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS evt_cleanup_expired
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  CALL cleanup_expired_links();

-- =====================================================
-- SELESAI! Database siap digunakan.
-- =====================================================

-- Verifikasi instalasi:
-- SHOW TABLES;
-- SELECT * FROM plans;
-- SELECT * FROM users WHERE email = 'admin@linkpendek.id';
