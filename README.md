# 🚀 LINKPENDEK - URL Shortener

**Aplikasi URL Shortener modern dengan PHP MySQL, bilingual (ID/EN), mobile-friendly, dengan fitur Gratis & Langganan**

---

## 📦 ISI PAKET

```
linkpendek/
├── 📁 database/
│   └── schema.sql              ← Import ke MySQL
├── 📁 api/
│   ├── config.php              ← Konfigurasi database
│   ├── config.php.example      ← Template config
│   ├── auth.php                ← API Register/Login
│   ├── urls.php                ← API URL Shortener
│   └── payment.php             ← API Pembayaran
├── 📁 public/
│   └── .htaccess               ← URL Routing
├── 📁 src/
│   ├── App.tsx                 ← Frontend React
│   ├── i18n.ts                 ← Translations
│   ├── index.css               ← Styles
│   └── main.tsx                ← Entry point
├── 📄 index.html
├── 📄 package.json
├── 📄 .env.example
└── 📄 README.md                ← File ini
```

---

## ⚡ QUICK START (5 Menit)

### 1️⃣ Setup Database

```bash
# Login ke MySQL
mysql -u root -p

# Import database
CREATE DATABASE linkpendek_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE linkpendek_db;
SOURCE database/schema.sql;

# Verifikasi
SHOW TABLES;
```

### 2️⃣ Konfigurasi Backend

```bash
# Copy template config
cp api/config.php.example api/config.php

# Edit konfigurasi
nano api/config.php
```

**Ubah bagian ini:**
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'linkpendek_db');
define('DB_USER', 'root');
define('DB_PASS', 'YOUR_PASSWORD');  // ⚠️ GANTI
define('APP_URL', 'http://localhost:8000');
define('SHORT_DOMAIN', 'lnk.pd');
define('APP_SECRET', 'random-string-32-chars');
```

### 3️⃣ Install Frontend

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev
```

### 4️⃣ Akses Aplikasi

```
Frontend: http://localhost:5173
API:      http://localhost:8000/api/
```

---

## 🔑 AKUN DEFAULT

```
Email:    admin@linkpendek.id
Password: admin123
Plan:     business
```

⚠️ **Ganti password setelah login pertama!**

---

## 📊 FITUR

### ✅ Gratis (Free Plan)
- 50 link per bulan
- Statistik dasar
- Link aktif 30 hari
- Community support

### 💎 Premium (Rp 49.000/bulan)
- 500 link per bulan
- Custom alias
- QR Code otomatis
- Analitik lengkap
- Link aktif 1 tahun
- Priority support

### 🏢 Bisnis (Rp 149.000/bulan)
- Unlimited link
- Custom domain
- API access
- Team collaboration
- White label
- 24/7 support
- Link aktif selamanya

---

## 🔌 API ENDPOINTS

### Autentikasi
```bash
POST /api/auth.php?action=register
POST /api/auth.php?action=login
GET  /api/auth.php?action=profile
```

### URL Shortener
```bash
POST /api/urls.php?action=shorten
GET  /api/urls.php?action=list
POST /api/urls.php?action=delete
GET  /api/urls.php?action=stats&code=xxx
GET  /api/urls.php?action=redirect&code=xxx
```

### Pembayaran
```bash
GET  /api/payment.php?action=plans
POST /api/payment.php?action=subscribe
POST /api/payment.php?action=cancel
GET  /api/payment.php?action=history
```

---

## 📝 CONTOH API

### Register User
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

### Persingkat URL
```bash
curl -X POST http://localhost:8000/api/urls.php?action=shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://google.com",
    "title": "Google"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "short_code": "abc123",
    "short_url": "lnk.pd/abc123",
    "original_url": "https://google.com"
  }
}
```

---

## 🗄️ STRUKTUR DATABASE

### Tabel Utama:
1. **users** - Data pengguna
2. **urls** - Link yang dipersingkat
3. **clicks** - Log klik untuk analitik
4. **plans** - Paket langganan
5. **payments** - Riwayat pembayaran
6. **settings** - Pengaturan aplikasi

### Relasi:
```
users (1) ──< (N) urls
urls  (1) ──< (N) clicks
users (1) ──< (N) payments
plans (1) ──< (N) payments
```

---

## 🛠️ TECH STACK

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 4
- **Backend:** PHP 7.4+ (Native)
- **Database:** MySQL 5.7+ / MariaDB 10.3+
- **Icons:** Font Awesome 6
- **Language:** Indonesia & English

---

## 📋 REQUIREMENTS

- PHP 7.4+ dengan extensions:
  - pdo_mysql
  - mbstring
  - json
  - curl
- MySQL 5.7+ atau MariaDB 10.3+
- Node.js 16+ & npm
- Apache/Nginx dengan mod_rewrite

---

## 🚀 DEPLOYMENT

### VPS (Ubuntu)
```bash
# Install dependencies
sudo apt update
sudo apt install apache2 mysql-server php php-mysql php-mbstring

# Setup database
mysql -u root -p < database/schema.sql

# Copy files
sudo cp -r . /var/www/linkpendek/
sudo chown -R www-www-data /var/www/linkpendek/

# Enable mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Docker
```bash
# Build image
docker build -t linkpendek .

# Run container
docker run -p 8000:80 linkpendek
```

---

## 🔒 SECURITY

- [x] Password hashing (bcrypt)
- [x] SQL injection prevention (prepared statements)
- [x] XSS protection
- [x] CSRF protection
- [x] Rate limiting
- [x] HTTPS recommended
- [x] Input validation
- [x] Output sanitization

---

## 📚 DOKUMENTASI LENGKAP

- **Setup Guide:** `DOKUMENTASI_SETUP.md`
- **Database Structure:** `DATABASE_STRUCTURE.md`
- **Download Guide:** `CARA_DOWNLOAD.md`

---

## 🐛 TROUBLESHOOTING

### Error: "Koneksi database gagal"
```bash
# Cek MySQL service
sudo systemctl status mysql

# Verifikasi kredensial di api/config.php
```

### Error: "404 Not Found"
```bash
# Enable mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2

# Cek .htaccess ada di public/
```

### Error: "Table doesn't exist"
```bash
# Import ulang schema
mysql -u root -p linkpendek_db < database/schema.sql
```

---

## 📞 SUPPORT

- 📧 Email: support@linkpendek.id
- 💬 WhatsApp: +62 812-3456-7890
- 📖 Docs: https://docs.linkpendek.id

---

## 📄 LICENSE

MIT License - Bebas digunakan untuk personal dan komersial.

---

## 🎉 CREDITS

Dibuat dengan ❤️ di Indonesia

**Version:** 1.0.0  
**Last Updated:** 2024  
**Author:** LinkPendek Team

---

**Happy Shortening! 🔗✨**
