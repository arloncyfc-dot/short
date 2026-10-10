# 🚀 QUICK START GUIDE - LinkPendek URL Shortener

## ⚡ Setup Cepat (5 Menit)

### 1️⃣ Persiapan Database

```bash
# Login ke MySQL
mysql -u root -p

# Buat database dan import schema
CREATE DATABASE linkpendek_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE linkpendek_db;
SOURCE database/schema.sql;

# Verifikasi
SHOW TABLES;
# Output: clicks, payments, plans, settings, urls, users
```

### 2️⃣ Konfigurasi

Edit file `api/config.php`:

```php
// Ganti dengan kredensial database Anda
define('DB_HOST', 'localhost');
define('DB_NAME', 'linkpendek_db');
define('DB_USER', 'root');
define('DB_PASS', 'YOUR_PASSWORD_HERE');  // ⚠️ GANTI INI

// Ganti dengan domain Anda
define('APP_URL', 'http://localhost:8000');
define('SHORT_DOMAIN', 'localhost:8000');

// Generate random string untuk security
define('APP_SECRET', 'generate-random-string-here');
```

### 3️⃣ Jalankan Server

```bash
# Option 1: PHP Built-in Server (untuk development)
php -S localhost:8000 -t public

# Option 2: XAMPP/WAMP
# Copy project ke htdocs, lalu akses http://localhost/linkpendek

# Option 3: Laravel Herd / Valet (Mac)
herd link linkpendek
```

### 4️⃣ Test API

```bash
# Test register
curl -X POST http://localhost:8000/api/auth.php?action=register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Test shorten URL
curl -X POST http://localhost:8000/api/urls.php?action=shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://www.google.com/search?q=url+shortener"
  }'
```

### 5️⃣ Akses Aplikasi

- **Frontend**: http://localhost:8000/
- **API Docs**: http://localhost:8000/api/
- **phpMyAdmin**: http://localhost/phpmyadmin (jika pakai XAMPP)

---

## 📁 Struktur Folder

```
linkpendek/
├── api/                    # Backend PHP API
│   ├── config.php         # Konfigurasi database & app
│   ├── auth.php           # API register/login
│   ├── urls.php           # API URL shortener
│   └── payment.php        # API pembayaran
├── database/              # Database files
│   └── schema.sql         # SQL schema lengkap
├── public/                # Frontend & public files
│   ├── .htaccess         # URL routing
│   ├── index.html        # Frontend React (build)
│   └── assets/           # CSS, JS, images
├── src/                   # Source code React
│   ├── App.tsx           # Main component
│   ├── i18n.ts           # Translations ID/EN
│   └── index.css         # Styles
├── DOKUMENTASI_SETUP.md   # Panduan lengkap
└── README.md             # File ini
```

---

## 🔧 Fitur Utama

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

## 🗄️ Database Schema

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

## 🔐 Security Checklist

- [ ] Ganti `APP_SECRET` dengan random string
- [ ] Ganti `JWT_SECRET` dengan random string
- [ ] Set password database yang kuat
- [ ] Enable HTTPS/SSL di production
- [ ] Block access ke file `config.php`
- [ ] Setup firewall untuk database
- [ ] Backup database secara rutin
- [ ] Update PHP dan MySQL ke versi terbaru

---

## 📊 Monitoring & Maintenance

### Cek database size:
```sql
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'linkpendek_db'
ORDER BY (data_length + index_length) DESC;
```

### Cleanup expired links:
```sql
-- Lihat berapa banyak link expired
SELECT COUNT(*) FROM urls 
WHERE expires_at < NOW() AND is_active = 1;

-- Deactivate expired links
UPDATE urls SET is_active = 0 
WHERE expires_at < NOW() AND is_active = 1;
```

### Backup database:
```bash
# Backup
mysqldump -u root -p linkpendek_db > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p linkpendek_db < backup_20240101.sql
```

---

## 🌐 Deployment

### VPS (Ubuntu/Debian):
```bash
# Install dependencies
sudo apt update
sudo apt install apache2 mysql-server php php-mysql php-mbstring php-curl

# Setup database
sudo mysql -u root -p < database/schema.sql

# Copy files
sudo cp -r . /var/www/linkpendek/
sudo chown -R www-data:www-data /var/www/linkpendek/

# Enable Apache modules
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Docker (Optional):
```dockerfile
# Dockerfile
FROM php:8.1-apache
RUN docker-php-ext-install pdo_mysql
COPY . /var/www/html/
EXPOSE 80
```

---

## 📞 Support & Resources

- 📖 Dokumentasi Lengkap: [DOKUMENTASI_SETUP.md](DOKUMENTASI_SETUP.md)
- 🐛 Bug Report: GitHub Issues
- 💡 Feature Request: GitHub Discussions
- 📧 Email: support@linkpendek.id

---

## 📄 License

MIT License - Bebas digunakan untuk personal dan komersial.

---

**Made with ❤️ in Indonesia**
