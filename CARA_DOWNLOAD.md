# 📥 CARA DOWNLOAD SOURCE CODE LENGKAP

## 🎯 Metode Download

### ✅ Metode 1: Download via Platform (RECOMMENDED)

Jika Anda menggunakan platform web-based seperti ini:

1. **Cari tombol "Download"** di interface platform
2. **Klik tombol Download** - biasanya di pojok kanan atas
3. **File akan terdownload** sebagai ZIP atau folder
4. **Extract file** jika dalam format ZIP

### ✅ Metode 2: Download via Script (Linux/Mac)

```bash
# 1. Jalankan script download
chmod +x download.sh
./download.sh

# 2. File ZIP akan dibuat: linkpendek-source-code-YYYYMMDD.zip
# 3. Download file tersebut dari folder project
```

### ✅ Metode 3: Copy Manual (Windows/Linux/Mac)

Copy semua file berikut ke folder lokal Anda:

```
📁 linkpendek/
├── 📁 database/
│   └── schema.sql
├── 📁 api/
│   ├── config.php
│   ├── config.php.example
│   ├── auth.php
│   ├── urls.php
│   └── payment.php
├── 📁 public/
│   └── .htaccess
├── 📁 src/
│   ├── App.tsx
│   ├── i18n.ts
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.js
├── README.md
├── DOKUMENTASI_SETUP.md
├── DATABASE_STRUCTURE.md
├── SETUP_SUMMARY.md
├── .env.example
├── .gitignore
├── setup.sh
└── download.sh
```

---

## 📋 Daftar File Lengkap

### 🗄️ Database
- `database/schema.sql` - Schema MySQL lengkap (6 tabel)

### 🔌 Backend API (PHP)
- `api/config.php` - Konfigurasi database
- `api/config.php.example` - Template konfigurasi
- `api/auth.php` - API autentikasi (register/login)
- `api/urls.php` - API URL shortener
- `api/payment.php` - API pembayaran

### 🎨 Frontend (React + TypeScript)
- `src/App.tsx` - Komponen utama aplikasi
- `src/i18n.ts` - Translations (Indonesia & English)
- `src/index.css` - Styles
- `src/main.tsx` - Entry point React
- `index.html` - HTML template
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `vite.config.js` - Vite config

### 🌐 Web Server
- `public/.htaccess` - URL routing & security

### 📚 Dokumentasi
- `README.md` - Quick start guide
- `DOKUMENTASI_SETUP.md` - Panduan setup lengkap
- `DATABASE_STRUCTURE.md` - Detail struktur database
- `SETUP_SUMMARY.md` - Ringkasan setup

### ⚙️ Konfigurasi & Scripts
- `.env.example` - Template environment variables
- `.gitignore` - Git ignore rules
- `setup.sh` - Script setup otomatis
- `download.sh` - Script download/packaging

---

## 🚀 Cara Install Setelah Download

### Step 1: Extract File
```bash
# Jika download dalam format ZIP
unzip linkpendek-source-code.zip
cd linkpendek
```

### Step 2: Install Dependencies
```bash
# Install Node.js dependencies
npm install
```

### Step 3: Setup Database
```bash
# Import database schema
mysql -u root -p < database/schema.sql

# Atau via phpMyAdmin:
# 1. Buka phpMyAdmin
# 2. Import file database/schema.sql
```

### Step 4: Konfigurasi
```bash
# Copy template config
cp api/config.php.example api/config.php

# Edit konfigurasi database
nano api/config.php  # atau gunakan editor favorit
```

Ubah bagian ini di `api/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'linkpendek_db');
define('DB_USER', 'root');
define('DB_PASS', 'YOUR_PASSWORD_HERE');  // ⚠️ GANTI INI
define('APP_URL', 'http://localhost:8000');
define('SHORT_DOMAIN', 'lnk.pd');
define('APP_SECRET', 'generate-random-string');
```

### Step 5: Jalankan Aplikasi
```bash
# Option 1: Development mode (dengan hot reload)
npm run dev

# Option 2: Build untuk production
npm run build
php -S localhost:8000 -t dist

# Option 3: PHP built-in server (untuk testing)
php -S localhost:8000 -t public
```

### Step 6: Akses Aplikasi
```bash
# Buka browser
http://localhost:5173  # jika pakai npm run dev
# atau
http://localhost:8000  # jika pakai PHP server
```

---

## 📊 Struktur Folder Setelah Download

```
linkpendek/
│
├── 📁 database/              # Database files
│   └── schema.sql           # Schema MySQL lengkap
│
├── 📁 api/                   # Backend PHP API
│   ├── config.php           # Konfigurasi (edit ini!)
│   ├── config.php.example   # Template config
│   ├── auth.php             # API register/login
│   ├── urls.php             # API URL shortener
│   └── payment.php          # API pembayaran
│
├── 📁 public/               # Public files
│   └── .htaccess           # URL routing
│
├── 📁 src/                  # Source code React
│   ├── App.tsx             # Main component
│   ├── i18n.ts             # Translations ID/EN
│   ├── index.css           # Styles
│   └── main.tsx            # Entry point
│
├── 📄 index.html           # HTML template
├── 📄 package.json         # Dependencies
├── 📄 tsconfig.json        # TypeScript config
├── 📄 vite.config.js       # Vite config
│
├── 📚 README.md            # Quick start
├── 📚 DOKUMENTASI_SETUP.md # Panduan lengkap
├── 📚 DATABASE_STRUCTURE.md # Detail database
├── 📚 SETUP_SUMMARY.md     # Ringkasan setup
│
├── ⚙️ .env.example         # Env template
├── ⚙️ .gitignore           # Git ignore
├── 🔧 setup.sh             # Setup script
└── 📥 download.sh          # Download script
```

---

## 🔑 Akun Default

Setelah setup database, gunakan akun ini untuk login:

```
Email: admin@linkpendek.id
Password: admin123
Plan: business
```

⚠️ **PENTING:** Ganti password ini setelah setup pertama!

---

## 📝 Checklist Download

- [ ] Download semua file source code
- [ ] Extract file ZIP (jika dalam format ZIP)
- [ ] Install Node.js (versi 16+)
- [ ] Install MySQL/MariaDB (versi 5.7+)
- [ ] Install PHP (versi 7.4+)
- [ ] Import database schema
- [ ] Edit `api/config.php`
- [ ] Jalankan `npm install`
- [ ] Jalankan aplikasi
- [ ] Test di browser
- [ ] Ganti password admin default

---

## 🆘 Troubleshooting Download

### ❌ Tidak ada tombol download
**Solusi:**
- Refresh halaman
- Cek apakah ada opsi "Export" atau "Download Project"
- Gunakan Metode 3 (Copy Manual)

### ❌ File tidak lengkap
**Solusi:**
- Pastikan semua file di atas sudah di-copy
- Cek folder `database/`, `api/`, `src/`, `public/`
- Download ulang jika perlu

### ❌ Error saat extract ZIP
**Solusi:**
- Gunakan aplikasi extract yang berbeda (7-Zip, WinRAR)
- Download ulang file
- Cek ukuran file (seharusnya > 100KB)

---

## 📞 Butuh Bantuan?

Jika ada masalah saat download atau install:

- 📖 Baca `DOKUMENTASI_SETUP.md` untuk panduan detail
- 📖 Baca `DATABASE_STRUCTURE.md` untuk detail database
- 📧 Email: support@linkpendek.id
- 💬 WhatsApp: +62 812-3456-7890

---

## 🎉 Selesai!

Source code lengkap sudah siap diunduh! 

**Total File:** 20+ files  
**Total Size:** ~200KB (source code saja)  
**Bahasa:** PHP, TypeScript, SQL, Bash  
**Framework:** React, Vite, Tailwind CSS  
**Database:** MySQL/MariaDB  

**Selamat menggunakan LinkPendek URL Shortener! 🚀**

---

**Dibuat dengan ❤️ oleh Tim LinkPendek**  
**Version 1.0.0 - 2024**
