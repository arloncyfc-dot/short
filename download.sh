#!/bin/bash

# =====================================================
# SCRIPT DOWNLOAD - LinkPendek URL Shortener
# Script ini akan mengemas semua file project menjadi ZIP
# =====================================================

echo "╔══════════════════════════════════════════════╗"
echo "║   LinkPendek - Download Source Code          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Nama file output
OUTPUT_FILE="linkpendek-source-code-$(date +%Y%m%d).zip"

echo "📦 Mengemas source code..."
echo ""

# Hapus file ZIP lama jika ada
if [ -f "$OUTPUT_FILE" ]; then
    rm "$OUTPUT_FILE"
fi

# Buat file ZIP dengan semua file project
zip -r "$OUTPUT_FILE" \
    database/ \
    api/ \
    public/ \
    src/ \
    index.html \
    package.json \
    README.md \
    DOKUMENTASI_SETUP.md \
    DATABASE_STRUCTURE.md \
    SETUP_SUMMARY.md \
    .env.example \
    .gitignore \
    setup.sh \
    -x "node_modules/*" \
    -x "dist/*" \
    -x "*.log" \
    -x ".DS_Store" \
    2>/dev/null

# Cek apakah ZIP berhasil dibuat
if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "✅ BERHASIL!"
    echo ""
    echo "📁 File ZIP telah dibuat: $OUTPUT_FILE"
    echo "📊 Ukuran: $FILE_SIZE"
    echo ""
    echo "📋 Isi file ZIP:"
    unzip -l "$OUTPUT_FILE" | tail -n +4 | head -n -2
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  CARA DOWNLOAD:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. File ZIP sudah tersedia di folder project"
    echo "2. Gunakan tombol 'Download' di platform ini"
    echo "3. Atau copy file: $OUTPUT_FILE"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  CARA INSTALL SETELAH DOWNLOAD:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Extract file ZIP:"
    echo "   unzip $OUTPUT_FILE"
    echo ""
    echo "2. Masuk ke folder project:"
    echo "   cd linkpendek"
    echo ""
    echo "3. Install dependencies:"
    echo "   npm install"
    echo ""
    echo "4. Setup database:"
    echo "   mysql -u root -p < database/schema.sql"
    echo ""
    echo "5. Edit konfigurasi:"
    echo "   cp api/config.php.example api/config.php"
    echo "   nano api/config.php"
    echo ""
    echo "6. Jalankan aplikasi:"
    echo "   npm run dev"
    echo ""
    echo "7. Akses di browser:"
    echo "   http://localhost:5173"
    echo ""
    echo "📚 Dokumentasi lengkap: README.md"
    echo ""
else
    echo "❌ GAGAL membuat file ZIP!"
    echo "Pastikan command 'zip' terinstall."
    echo ""
    echo "Install zip:"
    echo "  Ubuntu/Debian: sudo apt install zip"
    echo "  CentOS/RHEL: sudo yum install zip"
    echo "  Mac: brew install zip"
    exit 1
fi
