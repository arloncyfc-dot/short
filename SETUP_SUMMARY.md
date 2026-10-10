# ✅ SETUP DATABASE - LinkPendek URL Shortener

## 📦 File yang Telah Dibuat

### 🗄️ Database Files
1. **`database/schema.sql`** - Schema database MySQL lengkap
   - 6 tabel: users, urls, clicks, plans, payments, settings
   - Data awal paket langganan
   - Stored procedure untuk cleanup
   - Event scheduler otomatis

### 🔌 API Backend (PHP)
2. **`api/config.php`** - Konfigurasi database & helper functions
3. **`api/config.php.example`** - Template konfigurasi
4. **`api/auth.php`** - API autentikasi (register/login)
5. **`api/urls.php`** - API URL shortener (shorten/list/delete/stats)
6. **`api/payment.php`** - API pembayaran & langganan

### 🌐 Web Server
7. **`public/.htaccess`** - URL routing & security

### 📚 Dokumentasi
8. **`README.md`** - Quick start guide
9. **`DOKUMENTASI_SETUP.md`** - Panduan setup lengkap
10. **`DATABASE_STRUCTURE.md`** - Detail struktur database
11. **`SETUP_SUMMARY.md`** - File ini (ringkasan)

### ⚙️ Konfigurasi
12. **`.env.example`** - Template environment variables
13. **`.gitignore`** - Git ignore rules
14. **`setup.sh`** - Script setup otomatis (Linux/Mac)

---

## 🚀 Cara Setup Database (Step-by-Step)

### Option 1: Setup Manual (Recommended untuk Pemula)

#### Langkah 1: Install MySQL/MariaDB
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# Windows/Mac
# Download dari: https://dev.mysql.com/downloads/
# Atau gunakan XAMPP: https://www.apachefriends.org/
```

#### Langkah 2: Login ke MySQL
```bash
# Via terminal
mysql -u root -p

# Atau via phpMyAdmin (jika pakai XAMPP)
# Buka: http://localhost/phpmyadmin
```

#### Langkah 3: Import Database
```bash
# Via terminal
mysql -u root -p < database/schema.sql

# Atau via phpMyAdmin:
# 1. Buka phpMyAdmin
# 2. Klik tab "Import"
# 3. Upload file database/schema.sql
# 4. Klik "Go"
```

#### Langkah 4: Verifikasi
```sql
-- Cek database
SHOW DATABASES;
-- Output: linkpendek_db

-- Gunakan database
USE linkpendek_db;

-- Cek tabel
SHOW TABLES;
-- Output: clicks, payments, plans, settings, urls, users
```

#### Langkah 5: Edit Konfigurasi
```bash
# Copy template config
cp api/config.php.example api/config.php

# Edit file config.php
nano api/config.php  # atau gunakan editor favorit
```

Ubah bagian ini:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'linkpendek_db');
define('DB_USER', 'root');
define('DB_PASS', 'YOUR_PASSWORD_HERE');  // ⚠️ GANTI INI
define('APP_URL', 'http://localhost:8000');
define('SHORT_DOMAIN', 'lnk.pd');
define('APP_SECRET', 'generate-random-string-here');
```

#### Langkah 6: Jalankan Server
```bash
# PHP Built-in Server
php -S localhost:8000 -t public

# Atau gunakan XAMPP/WAMP
# Copy project ke htdocs
```

#### Langkah 7: Test Aplikasi
```bash
# Buka browser
http://localhost:8000

# Test API
curl http://localhost:8000/api/auth.php?action=register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456","confirmPassword":"123456"}'
```

---

### Option 2: Setup Otomatis (Linux/Mac)

```bash
# Jalankan setup script
chmod +x setup.sh
./setup.sh

# Script akan:
# ✓ Cek prasyarat (PHP, MySQL)
# ✓ Buat database
# ✓ Import schema
# ✓ Generate config file
# ✓ Setup permissions
# ✓ Jalankan server
```

---

## 📊 Struktur Database

### Tabel Utama:

```
┌─────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  users ──────< urls ──────< clicks                      │
│    │                                                    │
│    └────────< payments >───── plans                     │
│                                                          │
│  settings (konfigurasi aplikasi)                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Detail Tabel:

| Tabel | Fungsi | Jumlah Kolom |
|-------|--------|--------------|
| **users** | Data pengguna | 10 |
| **urls** | Link yang dipersingkat | 12 |
| **clicks** | Log klik untuk analitik | 11 |
| **plans** | Paket langganan | 13 |
| **payments** | Riwayat pembayaran | 10 |
| **settings** | Pengaturan aplikasi | 5 |

---

## 🔑 Akun Default

Setelah import database, sudah ada akun admin:

```
Email: admin@linkpendek.id
Password: admin123
Plan: business
API Key: lp_admin_api_key_2024
```

⚠️ **PENTING:** Ganti password ini setelah setup!

---

## 🌐 API Endpoints

### Autentikasi
- `POST /api/auth.php?action=register` - Register user baru
- `POST /api/auth.php?action=login` - Login
- `GET /api/auth.php?action=profile` - Get profile (butuh token)
- `POST /api/auth.php?action=logout` - Logout

### URL Shortener
- `POST /api/urls.php?action=shorten` - Persingkat URL
- `GET /api/urls.php?action=list` - List URL user
- `POST /api/urls.php?action=delete` - Hapus URL
- `GET /api/urls.php?action=stats&code=xxx` - Statistik URL
- `GET /api/urls.php?action=redirect&code=xxx` - Redirect short link

### Pembayaran
- `GET /api/payment.php?action=plans` - Get daftar paket
- `POST /api/payment.php?action=subscribe` - Subscribe paket
- `POST /api/payment.php?action=cancel` - Cancel subscription
- `GET /api/payment.php?action=history` - Riwayat pembayaran

---

## 📝 Contoh Penggunaan API

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/auth.php?action=register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**Response:**
```json
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

### 2. Persingkat URL
```bash
curl -X POST http://localhost:8000/api/urls.php?action=shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://www.google.com/search?q=url+shortener",
    "title": "Google Search"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "URL berhasil dipersingkat",
  "data": {
    "short_code": "abc123",
    "short_url": "lnk.pd/abc123",
    "original_url": "https://www.google.com/search?q=url+shortener",
    "expires_at": "2025-01-01 00:00:00"
  }
}
```

### 3. Akses Short Link
```bash
# Buka di browser atau curl
curl -L http://localhost:8000/abc123

# Akan redirect ke original URL
```

---

## 🔧 Troubleshooting

### ❌ Error: "Koneksi database gagal"
**Solusi:**
- Cek MySQL service berjalan: `sudo systemctl status mysql`
- Verifikasi kredensial di `api/config.php`
- Test koneksi manual: `mysql -u root -p`

### ❌ Error: "404 Not Found" saat akses short link
**Solusi:**
- Pastikan mod_rewrite Apache aktif: `sudo a2enmod rewrite`
- Cek file `.htaccess` ada di folder `public/`
- Restart Apache: `sudo systemctl restart apache2`

### ❌ Error: "Table doesn't exist"
**Solusi:**
- Import ulang schema: `mysql -u root -p linkpendek_db < database/schema.sql`
- Verifikasi database name di config.php

### ❌ Error: "Access denied"
**Solusi:**
- Cek permission folder: `chmod -R 755 /path/to/project`
- Cek owner: `chown -R www-data:www-data /path/to/project`

---

## 📚 Dokumentasi Lengkap

Untuk informasi lebih detail, baca file berikut:

1. **`README.md`** - Quick start guide & overview
2. **`DOKUMENTASI_SETUP.md`** - Panduan setup lengkap (ID)
3. **`DATABASE_STRUCTURE.md`** - Detail struktur database & query examples

---

## 🎯 Checklist Setup

- [ ] Install PHP 7.4+
- [ ] Install MySQL 5.7+ / MariaDB 10.3+
- [ ] Import database schema
- [ ] Edit `api/config.php` (DB credentials)
- [ ] Generate random string untuk APP_SECRET
- [ ] Setup permissions (chmod 755)
- [ ] Enable Apache mod_rewrite
- [ ] Test API endpoints
- [ ] Ganti password admin default
- [ ] Setup SSL/HTTPS (production)
- [ ] Setup backup database otomatis

---

## 📞 Support

Jika ada masalah:
- 📖 Baca dokumentasi lengkap di `DOKUMENTASI_SETUP.md`
- 🐛 Check troubleshooting section
- 📧 Email: support@linkpendek.id
- 💬 WhatsApp: +62 812-3456-7890

---

## 🎉 Selesai!

Database Anda sudah siap digunakan! 

**Next Steps:**
1. Test aplikasi di browser: http://localhost:8000
2. Register user baru
3. Coba persingkat URL
4. Explore dashboard & analytics
5. Deploy ke production (optional)

**Happy Coding! 🚀**

---

**Dibuat dengan ❤️ oleh Tim LinkPendek**  
**Version 1.0.0 - 2024**
