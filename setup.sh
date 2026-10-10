#!/bin/bash

# =====================================================
# SETUP SCRIPT - LinkPendek URL Shortener
# Script ini akan membantu setup database dan konfigurasi
# =====================================================

echo "╔══════════════════════════════════════════════╗"
echo "║   LinkPendek URL Shortener - Setup Script   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi helper
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# =====================================================
# 1. CEK PRASYARAT
# =====================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LANGKAH 1: Memeriksa Prasyarat"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cek PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n 1 | cut -d' ' -f2)
    print_success "PHP terinstall: versi $PHP_VERSION"
else
    print_error "PHP tidak ditemukan! Silakan install PHP 7.4+"
    exit 1
fi

# Cek MySQL
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version | awk '{print $3}')
    print_success "MySQL terinstall: versi $MYSQL_VERSION"
else
    print_error "MySQL tidak ditemukan! Silakan install MySQL 5.7+"
    exit 1
fi

# Cek PDO MySQL extension
if php -m | grep -q "pdo_mysql"; then
    print_success "Extension pdo_mysql tersedia"
else
    print_error "Extension pdo_mysql tidak ditemukan!"
    print_info "Install dengan: sudo apt install php-mysql"
    exit 1
fi

# Cek mbstring extension
if php -m | grep -q "mbstring"; then
    print_success "Extension mbstring tersedia"
else
    print_warning "Extension mbstring tidak ditemukan (opsional)"
fi

# =====================================================
# 2. SETUP DATABASE
# =====================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LANGKAH 2: Setup Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Masukkan MySQL Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Masukkan MySQL Username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Masukkan MySQL Password: " DB_PASS
echo ""

DB_NAME="linkpendek_db"

echo ""
print_info "Mengecek koneksi database..."

# Test koneksi
if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" &> /dev/null; then
    print_success "Koneksi database berhasil!"
else
    print_error "Koneksi database gagal!"
    print_info "Periksa kembali host, username, dan password"
    exit 1
fi

# Buat database
echo ""
print_info "Membuat database $DB_NAME..."

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -eq 0 ]; then
    print_success "Database $DB_NAME berhasil dibuat!"
else
    print_error "Gagal membuat database!"
    exit 1
fi

# Import schema
echo ""
print_info "Mengimport database schema..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCHEMA_FILE="$SCRIPT_DIR/database/schema.sql"

if [ -f "$SCHEMA_FILE" ]; then
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SCHEMA_FILE" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Database schema berhasil diimport!"
    else
        print_error "Gagal mengimport schema!"
        exit 1
    fi
else
    print_error "File schema.sql tidak ditemukan di: $SCHEMA_FILE"
    exit 1
fi

# Verifikasi tabel
echo ""
print_info "Memverifikasi tabel..."
TABLES=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES" 2>/dev/null | tail -n +2)
TABLE_COUNT=$(echo "$TABLES" | wc -l)

if [ "$TABLE_COUNT" -ge 6 ]; then
    print_success "$TABLE_COUNT tabel berhasil dibuat:"
    echo "$TABLES" | while read table; do
        echo "  - $table"
    done
else
    print_warning "Hanya $TABLE_COUNT tabel ditemukan (seharusnya 6)"
fi

# =====================================================
# 3. GENERATE CONFIG FILE
# =====================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LANGKAH 3: Generate File Konfigurasi"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate random strings
APP_SECRET=$(php -r "echo bin2hex(random_bytes(32));")
JWT_SECRET=$(php -r "echo bin2hex(random_bytes(32));")

CONFIG_FILE="$SCRIPT_DIR/api/config.php"
CONFIG_TEMPLATE="$SCRIPT_DIR/api/config.php"

if [ -f "$CONFIG_TEMPLATE" ]; then
    # Backup existing config
    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d%H%M%S)"
        print_info "Backup config lama dibuat"
    fi
    
    # Update config file
    sed -i "s/define('DB_HOST', 'localhost')/define('DB_HOST', '$DB_HOST')/" "$CONFIG_FILE"
    sed -i "s/define('DB_NAME', 'linkpendek_db')/define('DB_NAME', '$DB_NAME')/" "$CONFIG_FILE"
    sed -i "s/define('DB_USER', 'root')/define('DB_USER', '$DB_USER')/" "$CONFIG_FILE"
    sed -i "s/define('DB_PASS', '')/define('DB_PASS', '$DB_PASS')/" "$CONFIG_FILE"
    sed -i "s/define('APP_SECRET', '.*')/define('APP_SECRET', '$APP_SECRET')/" "$CONFIG_FILE"
    sed -i "s/define('JWT_SECRET', '.*')/define('JWT_SECRET', '$JWT_SECRET')/" "$CONFIG_FILE"
    
    print_success "File konfigurasi berhasil diupdate!"
else
    print_error "File config.php tidak ditemukan!"
fi

# =====================================================
# 4. SETUP PERMISSIONS
# =====================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LANGKAH 4: Setup Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create necessary directories
mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/storage"
mkdir -p "$SCRIPT_DIR/storage/uploads"

chmod -R 755 "$SCRIPT_DIR"
chmod -R 777 "$SCRIPT_DIR/logs" 2>/dev/null
chmod -R 777 "$SCRIPT_DIR/storage" 2>/dev/null

print_success "Permissions berhasil di-setup!"

# =====================================================
# 5. TEST API
# =====================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LANGKAH 5: Test Koneksi API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "Menjalankan PHP built-in server untuk testing..."
print_info "Server akan berjalan di: http://localhost:8000"
print_info "Tekan Ctrl+C untuk menghentikan server"
echo ""

# Start PHP server
cd "$SCRIPT_DIR/public"
php -S localhost:8000

# =====================================================
# SELESAI
# =====================================================
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          SETUP BERHASIL! 🎉                  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Informasi Setup:"
echo "  Database: $DB_NAME"
echo "  Host: $DB_HOST"
echo "  User: $DB_USER"
echo ""
echo "Akses Aplikasi:"
echo "  Frontend: http://localhost:8000"
echo "  API: http://localhost:8000/api/"
echo ""
echo "Akun Default:"
echo "  Email: admin@linkpendek.id"
echo "  Password: admin123"
echo ""
echo "Dokumentasi lengkap: DOKUMENTASI_SETUP.md"
echo ""
