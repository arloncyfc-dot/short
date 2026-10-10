# 🗄️ STRUKTUR DATABASE - LinkPendek URL Shortener

## 📊 Diagram Relasi Database

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE: linkpendek_db                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│      users       │         │      plans       │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ name             │         │ name             │
│ email (UNIQUE)   │         │ slug (UNIQUE)    │
│ password (HASH)  │         │ price_monthly    │
│ plan (FK→plans)  │◄────────│ price_yearly     │
│ plan_expired_at  │         │ max_links        │
│ api_key (UNIQUE) │         │ custom_alias     │
│ is_active        │         │ qr_code          │
│ created_at       │         │ analytics        │
│ updated_at       │         │ api_access       │
└────────┬─────────┘         │ custom_domain    │
         │                   │ priority_support │
         │ 1                 └──────────────────┘
         │
         │ N
         ▼
┌──────────────────┐         ┌──────────────────┐
│      urls        │         │    payments      │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ user_id (FK)     │         │ user_id (FK)     │
│ short_code (UQ)  │         │ plan_id (FK)     │
│ original_url     │         │ amount           │
│ custom_alias(UQ) │         │ payment_method   │
│ title            │         │ transaction_id   │
│ clicks           │         │ status           │
│ is_active        │         │ paid_at          │
│ expires_at       │         │ created_at       │
│ created_at       │         └──────────────────┘
│ updated_at       │
└────────┬─────────┘
         │
         │ 1
         │
         │ N
         ▼
┌──────────────────┐
│     clicks       │
├──────────────────┤
│ id (PK)          │
│ url_id (FK)      │
│ ip_address       │
│ user_agent       │
│ referrer         │
│ country          │
│ city             │
│ device_type      │
│ browser          │
│ os               │
│ clicked_at       │
└──────────────────┘

┌──────────────────┐
│    settings      │
├──────────────────┤
│ id (PK)          │
│ setting_key (UQ) │
│ setting_value    │
│ description      │
│ updated_at       │
└──────────────────┘

Legenda:
  PK = Primary Key
  FK = Foreign Key
  UQ = Unique
  HASH = Bcrypt encrypted
```

---

## 📋 Detail Tabel

### 1. Tabel `users` (Pengguna)

**Fungsi:** Menyimpan data semua pengguna aplikasi

**Kolom Utama:**
- `id` - ID unik user (auto increment)
- `name` - Nama lengkap
- `email` - Email (harus unik)
- `password` - Password yang sudah di-hash dengan bcrypt
- `plan` - Paket langganan: free/premium/business
- `plan_expired_at` - Tanggal expired paket berbayar
- `api_key` - API key untuk akses API (unik)
- `is_active` - Status akun (1=aktif, 0=nonaktif)

**Contoh Data:**
```sql
INSERT INTO users (name, email, password, plan) VALUES
('John Doe', 'john@example.com', '$2y$10$...', 'premium');
```

---

### 2. Tabel `urls` (Link yang Dipersingkat)

**Fungsi:** Menyimpan semua URL yang sudah dipersingkat

**Kolom Utama:**
- `id` - ID unik URL
- `user_id` - ID user pemilik (NULL jika guest)
- `short_code` - Kode pendek 6 karakter (contoh: abc123)
- `original_url` - URL asli yang dipendekkan
- `custom_alias` - Alias kustom (opsional, premium+)
- `title` - Judul link (opsional)
- `clicks` - Jumlah total klik
- `is_active` - Status aktif (1=aktif, 0=nonaktif/expired)
- `expires_at` - Tanggal kadaluarsa (NULL = selamanya)

**Contoh Data:**
```sql
INSERT INTO urls (user_id, short_code, original_url, clicks) VALUES
(1, 'abc123', 'https://google.com/search?q=url+shortener', 150);
```

**Index Penting:**
- `short_code` (UNIQUE) - Untuk lookup cepat saat redirect
- `custom_alias` (UNIQUE) - Untuk custom URL
- `user_id` - Untuk query list URL per user

---

### 3. Tabel `clicks` (Log Klik)

**Fungsi:** Mencatat setiap klik pada short link untuk analitik

**Kolom Utama:**
- `id` - ID unik log
- `url_id` - ID URL yang diklik
- `ip_address` - IP pengunjung
- `user_agent` - Info browser/device
- `referrer` - Dari mana pengunjung datang
- `country` - Kode negara (ID, US, dll)
- `city` - Nama kota
- `device_type` - desktop/mobile/tablet
- `browser` - Chrome, Firefox, Safari, dll
- `os` - Windows, macOS, Android, dll
- `clicked_at` - Timestamp klik

**Contoh Data:**
```sql
INSERT INTO clicks (url_id, ip_address, device_type, browser, os) VALUES
(1, '192.168.1.1', 'mobile', 'Chrome', 'Android');
```

**Performa:**
- Tabel ini bisa sangat besar (jutaan baris)
- Gunakan BIGINT untuk ID
- Partition by date jika data sangat besar
- Archive data lama (> 1 tahun)

---

### 4. Tabel `plans` (Paket Langganan)

**Fungsi:** Definisi paket dan fiturnya

**Kolom Utama:**
- `id` - ID unik paket
- `name` - Nama paket (Gratis, Premium, Bisnis)
- `slug` - Identifier (free, premium, business)
- `price_monthly` - Harga per bulan (dalam Rupiah)
- `price_yearly` - Harga per tahun
- `max_links` - Batas jumlah link
- `custom_alias` - Fitur custom alias (0/1)
- `qr_code` - Fitur QR code (0/1)
- `analytics` - Fitur analitik (0/1)
- `api_access` - Akses API (0/1)
- `custom_domain` - Custom domain (0/1)
- `priority_support` - Priority support (0/1)

**Data Default:**
```sql
-- Gratis
INSERT INTO plans VALUES (1, 'Gratis', 'free', 0, 0, 50, 0, 0, 1, 0, 0, 0);

-- Premium (Rp 49.000/bulan)
INSERT INTO plans VALUES (2, 'Premium', 'premium', 49000, 490000, 500, 1, 1, 1, 0, 0, 1);

-- Bisnis (Rp 149.000/bulan)
INSERT INTO plans VALUES (3, 'Bisnis', 'business', 149000, 1490000, 99999, 1, 1, 1, 1, 1, 1);
```

---

### 5. Tabel `payments` (Pembayaran)

**Fungsi:** Riwayat transaksi pembayaran

**Kolom Utama:**
- `id` - ID unik pembayaran
- `user_id` - ID user yang membayar
- `plan_id` - ID paket yang dibeli
- `amount` - Jumlah pembayaran
- `payment_method` - Metode (bank_transfer, credit_card, ewallet)
- `transaction_id` - ID transaksi dari payment gateway
- `status` - pending/success/failed/refunded
- `paid_at` - Tanggal pembayaran berhasil

**Flow Pembayaran:**
```
1. User pilih paket → Buat record payment (status: pending)
2. User bayar → Payment gateway kirim webhook
3. Webhook update status → success
4. Update user plan & expired date
```

---

### 6. Tabel `settings` (Pengaturan)

**Fungsi:** Konfigurasi aplikasi yang bisa diubah via admin panel

**Kolom Utama:**
- `id` - ID unik setting
- `setting_key` - Key/nama setting (unik)
- `setting_value` - Nilai setting
- `description` - Deskripsi setting

**Contoh Data:**
```sql
INSERT INTO settings (setting_key, setting_value, description) VALUES
('site_name', 'LinkPendek', 'Nama situs'),
('free_link_limit', '50', 'Batas link untuk user gratis'),
('maintenance_mode', '0', 'Mode maintenance (0/1)');
```

---

## 🔍 Query yang Sering Digunakan

### 1. Persingkat URL (Insert)
```sql
INSERT INTO urls (user_id, short_code, original_url, expires_at)
VALUES (1, 'abc123', 'https://example.com', '2025-01-01 00:00:00');
```

### 2. Redirect (Select by short_code)
```sql
SELECT * FROM urls 
WHERE short_code = 'abc123' 
  AND is_active = 1 
  AND (expires_at IS NULL OR expires_at > NOW());
```

### 3. Log Click (Insert)
```sql
INSERT INTO clicks (url_id, ip_address, user_agent, device_type, browser, os)
VALUES (1, '192.168.1.1', 'Mozilla/5.0...', 'mobile', 'Chrome', 'Android');

UPDATE urls SET clicks = clicks + 1 WHERE id = 1;
```

### 4. List URL User (dengan pagination)
```sql
SELECT * FROM urls 
WHERE user_id = 1 
ORDER BY created_at DESC 
LIMIT 10 OFFSET 0;
```

### 5. Statistik URL
```sql
-- Total clicks per hari (30 hari terakhir)
SELECT DATE(clicked_at) as date, COUNT(*) as clicks
FROM clicks
WHERE url_id = 1
  AND clicked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(clicked_at)
ORDER BY date DESC;

-- Stats per device
SELECT device_type, COUNT(*) as count
FROM clicks
WHERE url_id = 1
GROUP BY device_type;
```

### 6. Cek Limit User
```sql
SELECT COUNT(*) as total_links
FROM urls
WHERE user_id = 1 AND is_active = 1;

-- Bandingkan dengan limit plan
SELECT p.max_links
FROM users u
JOIN plans p ON u.plan = p.slug
WHERE u.id = 1;
```

### 7. Cleanup Expired Links
```sql
UPDATE urls 
SET is_active = 0 
WHERE expires_at < NOW() 
  AND is_active = 1;
```

---

## ⚡ Optimasi Performa

### Index yang Sudah Dibuat:
```sql
-- users
INDEX idx_email (email)
INDEX idx_api_key (api_key)
INDEX idx_plan (plan)

-- urls
UNIQUE INDEX idx_short_code (short_code)
UNIQUE INDEX idx_custom_alias (custom_alias)
INDEX idx_user_id (user_id)
INDEX idx_is_active (is_active)
INDEX idx_expires_at (expires_at)

-- clicks
INDEX idx_url_id (url_id)
INDEX idx_clicked_at (clicked_at)
INDEX idx_ip_address (ip_address)
```

### Tips Optimasi:
1. **Gunakan EXPLAIN** untuk analisis query lambat
2. **Partition tabel clicks** berdasarkan tanggal jika data sangat besar
3. **Archive data lama** (> 1 tahun) ke tabel terpisah
4. **Gunakan Redis** untuk cache short_code → original_url mapping
5. **Enable query cache** di MySQL

### Contoh Query Optimization:
```sql
-- ❌ LAMBAT (tanpa index)
SELECT * FROM urls WHERE short_code = 'abc123';

-- ✓ CEPAT (dengan index)
-- Sudah ada UNIQUE INDEX pada short_code
```

---

## 🔒 Security Best Practices

### 1. Password Hashing
```php
// ✓ BENAR - Gunakan bcrypt
$hash = password_hash($password, PASSWORD_BCRYPT);

// ❌ SALAH - Jangan gunakan MD5/SHA1
$hash = md5($password); // JANGAN!
```

### 2. SQL Injection Prevention
```php
// ✓ BENAR - Gunakan prepared statements
$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);

// ❌ SALAH - Jangan concat string
$query = "SELECT * FROM users WHERE email = '$email'"; // BAHAYA!
```

### 3. Input Validation
```php
// Validasi URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    die("URL tidak valid");
}

// Sanitize input
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
```

### 4. Rate Limiting
```php
// Batasi request per IP
$ip = getClientIP();
$stmt = $db->prepare("
    SELECT COUNT(*) as count 
    FROM clicks 
    WHERE ip_address = ? 
    AND clicked_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
");
$stmt->execute([$ip]);
$count = $stmt->fetch()['count'];

if ($count > 100) {
    die("Rate limit exceeded");
}
```

---

## 📈 Monitoring & Maintenance

### Cek Database Health:
```sql
-- Ukuran database
SELECT 
    table_name,
    ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)',
    table_rows
FROM information_schema.TABLES
WHERE table_schema = 'linkpendek_db'
ORDER BY (data_length + index_length) DESC;

-- Slow queries
SHOW VARIABLES LIKE 'slow_query_log';

-- Connection status
SHOW STATUS LIKE 'Threads_connected';
```

### Backup Otomatis:
```bash
# Crontab (backup setiap hari jam 2 pagi)
0 2 * * * /usr/bin/mysqldump -u root -p'password' linkpendek_db > /backup/linkpendek_$(date +\%Y\%m\%d).sql

# Compress backup
0 3 * * * /usr/bin/gzip /backup/linkpendek_$(date +\%Y\%m\%d).sql
```

### Cleanup Script:
```sql
-- Hapus clicks lama (> 1 tahun)
DELETE FROM clicks 
WHERE clicked_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Archive ke tabel terpisah
INSERT INTO clicks_archive 
SELECT * FROM clicks 
WHERE clicked_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

DELETE FROM clicks 
WHERE clicked_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

---

**Dokumentasi ini akan terus diupdate sesuai perkembangan aplikasi.**

**Terakhir diupdate:** 2024
