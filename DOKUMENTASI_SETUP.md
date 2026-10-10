# 📚 PANDUAN SETUP DATABASE - LinkPendek URL Shortener

## 📋 Daftar Isi
1. [Persyaratan Sistem](#persyaratan-sistem)
2. [Instalasi Database](#instalasi-database)
3. [Konfigurasi](#konfigurasi)
4. [Struktur Database](#struktur-database)
5. [API Endpoints](#api-endpoints)
6. [Cara Menggunakan](#cara-menggunakan)
7. [Troubleshooting](#troubleshooting)

---

## 1. Persyaratan Sistem

### Software yang dibutuhkan:
- **PHP** versi 7.4 atau lebih tinggi (direkomendasikan PHP 8.0+)
- **MySQL** versi 5.7+ atau **MariaDB** versi 10.3+
- **Web Server**: Apache (dengan mod_rewrite) atau Nginx
- **Composer** (opsional, untuk dependency management)

### Extension PHP yang dibutuhkan:
```bash
# Cek extension yang terinstall
php -m

# Extension yang dibutuhkan:
- pdo_mysql
- json
- mbstring
- openssl
- curl
```

### Install extension (jika belum ada):
```bash
# Ubuntu/Debian
sudo apt-get install php-mysql php-mbstring php-curl

# CentOS/RHEL
sudo yum install php-mysqlnd php-mbstring php-curl

# Windows (XAMPP/WAMP)
# Edit php.ini, uncomment:
extension=pdo_mysql
extension=mbstring
extension=curl
```

---

## 2. Instalasi Database

### Langkah 1: Login ke MySQL
```bash
# Via terminal/command line
mysql -u root -p

# Atau via phpMyAdmin (jika menggunakan XAMPP/WAMP)
# Buka: http://localhost/phpmyadmin
```

### Langkah 2: Jalankan file SQL
```bash
# Via terminal
mysql -u root -p < database/schema.sql

# Atau via phpMyAdmin:
# 1. Buka phpMyAdmin
# 2. Klik tab "Import"
# 3. Upload file database/schema.sql
# 4. Klik "Go" / "Kirim"
```

### Langkah 3: Verifikasi database
```sql
-- Cek database sudah terbuat
SHOW DATABASES;

-- Gunakan database
USE linkpendek_db;

-- Cek tabel sudah terbuat
SHOW TABLES;

-- Output yang diharapkan:
-- +-------------------------+
-- | clicks                  |
-- | payments                |
-- | plans                   |
-- | settings                |
-- | urls                    |
-- | users                   |
-- +-------------------------+
```

---

## 3. Konfigurasi

### Edit file `api/config.php`

```php
// =====================================================
// KONFIGURASI DATABASE - WAJIB DIUBAH
// =====================================================
define('DB_HOST', 'localhost');        // Host database
define('DB_NAME', 'linkpendek_db');    // Nama database
define('DB_USER', 'root');             // Username MySQL
define('DB_PASS', 'password_anda');    // Password MySQL (GANTI INI!)
define('DB_CHARSET', 'utf8mb4');

// =====================================================
// KONFIGURASI APLIKASI - WAJIB DIUBAH
// =====================================================
define('APP_NAME', 'LinkPendek');
define('APP_URL', 'https://linkpendek.id');  // URL domain Anda
define('SHORT_DOMAIN', 'lnk.pd');             // Domain short link
define('APP_SECRET', 'ganti-dengan-random-string-panjang'); // GANTI INI!

// =====================================================
// KONFIGURASI JWT
// =====================================================
define('JWT_SECRET', 'ganti-dengan-random-string-lain');
define('JWT_EXPIRY', 86400); // 24 jam
```

### Generate random string untuk security:
```bash
# Linux/Mac
php -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"

# Atau gunakan online generator:
# https://www.random.org/strings/
```

---

## 4. Struktur Database

### 📊 Tabel `users` - Data pengguna
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT | Primary key, auto increment |
| name | VARCHAR(100) | Nama lengkap user |
| email | VARCHAR(150) | Email (unique) |
| password | VARCHAR(255) | Password (bcrypt hash) |
| plan | ENUM | free/premium/business |
| plan_expired_at | DATETIME | Tanggal expired paket |
| api_key | VARCHAR(64) | API key untuk akses API |
| is_active | TINYINT | Status aktif (0/1) |

### 🔗 Tabel `urls` - Link yang dipersingkat
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT | Primary key |
| user_id | INT | Foreign key ke users |
| short_code | VARCHAR(10) | Kode pendek (unique) |
| original_url | TEXT | URL asli yang dipendekkan |
| custom_alias | VARCHAR(50) | Alias kustom (opsional) |
| title | VARCHAR(255) | Judul link |
| clicks | INT | Jumlah klik |
| is_active | TINYINT | Status aktif |
| expires_at | DATETIME | Tanggal kadaluarsa |

### 📈 Tabel `clicks` - Log klik untuk analitik
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | BIGINT | Primary key |
| url_id | INT | Foreign key ke urls |
| ip_address | VARCHAR(45) | IP pengunjung |
| user_agent | TEXT | Browser/device info |
| referrer | TEXT | Dari mana pengunjung datang |
| device_type | ENUM | desktop/mobile/tablet |
| browser | VARCHAR(50) | Jenis browser |
| os | VARCHAR(50) | Sistem operasi |
| clicked_at | TIMESTAMP | Waktu klik |

### 💳 Tabel `plans` - Paket langganan
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT | Primary key |
| name | VARCHAR(50) | Nama paket |
| slug | VARCHAR(50) | Identifier (free/premium/business) |
| price_monthly | DECIMAL | Harga per bulan |
| price_yearly | DECIMAL | Harga per tahun |
| max_links | INT | Batas jumlah link |
| custom_alias | TINYINT | Fitur custom alias |
| qr_code | TINYINT | Fitur QR code |
| analytics | TINYINT | Fitur analitik |
| api_access | TINYINT | Akses API |

### 💰 Tabel `payments` - Riwayat pembayaran
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | INT | Primary key |
| user_id | INT | Foreign key ke users |
| plan_id | INT | Foreign key ke plans |
| amount | DECIMAL | Jumlah pembayaran |
| payment_method | VARCHAR(50) | Metode pembayaran |
| transaction_id | VARCHAR(100) | ID transaksi |
| status | ENUM | pending/success/failed/refunded |
| paid_at | DATETIME | Tanggal pembayaran |

---

## 5. API Endpoints

### 🔐 Autentikasi

#### Register User
```bash
POST /api/auth.php?action=register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response:
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "plan": "free",
    "token": "base64_encoded_token",
    "api_key": "lp_xxxxxxxx"
  }
}
```

#### Login
```bash
POST /api/auth.php?action=login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "base64_encoded_token",
    "plan": "free"
  }
}
```

### 🔗 URL Shortener

#### Persingkat URL
```bash
POST /api/urls.php?action=shorten
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://example.com/very-long-url-here",
  "alias": "mylink",        // opsional (premium+)
  "title": "My Website"     // opsional
}

Response:
{
  "success": true,
  "message": "URL berhasil dipersingkat",
  "data": {
    "short_code": "abc123",
    "short_url": "lnk.pd/abc123",
    "original_url": "https://example.com/very-long-url-here",
    "expires_at": "2025-01-01 00:00:00"
  }
}
```

#### List URL User
```bash
GET /api/urls.php?action=list&page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "urls": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "total_pages": 5
    }
  }
}
```

#### Hapus URL
```bash
POST /api/urls.php?action=delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": 1
}
```

#### Statistik URL
```bash
GET /api/urls.php?action=stats&code=abc123
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "url": {
      "short_code": "abc123",
      "total_clicks": 150
    },
    "analytics": {
      "clicks_by_date": [...],
      "device_stats": [...],
      "browser_stats": [...]
    }
  }
}
```

### 💳 Pembayaran

#### Get Plans
```bash
GET /api/payment.php?action=plans

Response:
{
  "success": true,
  "data": [
    {
      "name": "Gratis",
      "slug": "free",
      "price_monthly": 0,
      "max_links": 50
    },
    {
      "name": "Premium",
      "slug": "premium",
      "price_monthly": 49000,
      "max_links": 500
    }
  ]
}
```

#### Subscribe
```bash
POST /api/payment.php?action=subscribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "premium",
  "payment_method": "bank_transfer",
  "duration": "monthly"
}
```

---

## 6. Cara Menggunakan

### Setup di Localhost (XAMPP/WAMP)

1. **Install XAMPP/WAMP**
   - Download dari https://www.apachefriends.org/
   - Install dan jalankan Apache + MySQL

2. **Copy project ke htdocs**
   ```bash
   # Windows
   C:\xampp\htdocs\linkpendek\
   
   # Atau di folder project Anda
   ```

3. **Import database**
   - Buka phpMyAdmin: http://localhost/phpmyadmin
   - Import file `database/schema.sql`

4. **Edit konfigurasi**
   - Buka `api/config.php`
   - Ubah DB_PASS jika ada password MySQL

5. **Akses aplikasi**
   - Frontend: http://localhost/linkpendek/
   - API: http://localhost/linkpendek/api/

### Setup di Server Production (VPS/Hosting)

1. **Upload file ke server**
   ```bash
   # Via FTP/SFTP atau Git
   git clone your-repo /var/www/linkpendek
   ```

2. **Setup database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Set permissions**
   ```bash
   chmod -R 755 /var/www/linkpendek
   chown -R www-data:www-data /var/www/linkpendek
   ```

4. **Konfigurasi Apache Virtual Host**
   ```apache
   <VirtualHost *:80>
       ServerName linkpendek.id
       ServerAlias www.linkpendek.id
       DocumentRoot /var/www/linkpendek/public
       
       <Directory /var/www/linkpendek/public>
           AllowOverride All
           Require all granted
       </Directory>
       
       ErrorLog ${APACHE_LOG_DIR}/linkpendek_error.log
       CustomLog ${APACHE_LOG_DIR}/linkpendek_access.log combined
   </VirtualHost>
   ```

5. **Setup SSL (HTTPS)**
   ```bash
   # Install Let's Encrypt
   sudo apt install certbot python3-certbot-apache
   sudo certbot --apache -d linkpendek.id -d www.linkpendek.id
   ```

6. **Setup short domain (lnk.pd)**
   ```apache
   <VirtualHost *:80>
       ServerName lnk.pd
       DocumentRoot /var/www/linkpendek/public
       
       <Directory /var/www/linkpendek/public>
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

---

## 7. Troubleshooting

### ❌ Error: "Koneksi database gagal"
**Solusi:**
- Cek apakah MySQL service berjalan: `sudo systemctl status mysql`
- Verifikasi kredensial di `api/config.php`
- Pastikan database sudah terbuat: `SHOW DATABASES;`

### ❌ Error: "404 Not Found" saat akses short link
**Solusi:**
- Pastikan mod_rewrite Apache aktif: `sudo a2enmod rewrite`
- Cek file `.htaccess` ada di root directory
- Verifikasi AllowOverride di konfigurasi Apache

### ❌ Error: "CORS error" di browser
**Solusi:**
- File `api/config.php` sudah include CORS headers
- Pastikan tidak ada firewall yang memblokir

### ❌ Error: "Token expired"
**Solusi:**
- Token default expired setelah 24 jam
- User perlu login ulang untuk mendapatkan token baru
- Atau ubah `JWT_EXPIRY` di config.php

### ❌ Short link tidak redirect
**Solusi:**
- Cek `.htaccess` sudah terpasang
- Pastikan Apache mod_rewrite aktif
- Cek error log Apache: `tail -f /var/log/apache2/error.log`

### ❌ Data tidak tersimpan
**Solusi:**
- Cek permission folder: `chmod 755 api/`
- Cek PHP error log
- Pastikan database connection berhasil

---

## 📞 Support

Jika ada pertanyaan atau masalah:
- Email: support@linkpendek.id
- WhatsApp: +62 812-3456-7890
- Documentation: https://docs.linkpendek.id

---

## 📝 Changelog

### Version 1.0.0 (2024)
- ✅ Database schema lengkap
- ✅ API autentikasi (register/login)
- ✅ API URL shortener
- ✅ API analytics
- ✅ API payment/subscription
- ✅ .htaccess routing
- ✅ Multi-language support (ID/EN)

---

**Dibuat dengan ❤️ oleh Tim LinkPendek**
