# YuXin WhatsApp Bot

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js Version">
  <img src="https://img.shields.io/badge/Baileys-Latest-blue?logo=whatsapp" alt="Baileys">
  <img src="https://img.shields.io/badge/MongoDB-Supported-green?logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/MySQL-Supported-blue?logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
</div>

<p align="center">
  <strong>Bot WhatsApp cerdas berbasis Node.js dengan arsitektur modular dan sistem plugin yang fleksibel.</strong>
</p>

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Prasyarat Instalasi](#-prasyarat-instalasi)
- [Susunan Project](#-susunan-project)
- [Instalasi & Konfigurasi](#-instalasi--konfigurasi)
- [Contoh Penggunaan](#-contoh-penggunaan)

## ✨ Fitur Utama

### 🤖 Artificial Intelligence
- **ChatGPT Integration** - Chatbot AI untuk menjawab pertanyaan umum secara cerdas

### 🎬 Anime
- **Anichin Scraper** - Mencari judul anime, episode terbaru, dan link streaming

### 🔄 Converter & Media
- **Sticker Creator** - Mengubah gambar/video menjadi stiker WhatsApp
- **Media Converter** - Konversi format (audio, image, video)
- **Brat Generator** - Membuat stiker/gambar bergaya tren "Brat"
- **Image Effects** - Memberikan filter/efek pada gambar

### 💳 Digital / PPOB (Digiflazz)
- **Cek Harga** - Daftar harga produk digital (pulsa, kuota, game)
- **Cek Saldo** - Monitoring saldo Digiflazz

### 📥 Downloader
- **Multi-Platform Support** - TikTok, Instagram, Facebook, Twitter/X, Spotify, Pinterest, Threads, Mediafire
- **YouTube Integration** - Menggunakan yt-dlp untuk download media

### 👥 Group Management
- **Member Control** - Add/kick member
- **Admin Management** - Promote/demote admin
- **Tag All** - Mention semua anggota grup
- **Group Settings** - Ubah foto profil grup, aturan grup

### 👑 Owner/Developer Tools
- **Eval & Exec** - Jalankan kode JavaScript atau perintah shell langsung dari WhatsApp
- **User Management** - Ban/unban pengguna
- **Bot Settings** - Ubah pengaturan bot secara dinamis
- **Session Management** - Kelola riwayat chat dan sesi

### 🛠️ Tools & Miscellaneous
- **Lyrics Finder** - Mencari lirik lagu
- **Music Recognition** - Identifikasi lagu dari audio (Shazam-like)
- **Screenshot** - Capture screenshot website
- **View Once Recovery** - Baca pesan "View Once"

## 🛠️ Teknologi yang Digunakan

| Kategori | Teknologi |
|----------|-----------|
| **Runtime** | Node.js 18+ |
| **WhatsApp Library** | [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) |
| **Database** | MongoDB (Mongoose), MySQL, Local JSON |
| **Process Manager** | PM2 |
| **Downloader** | yt-dlp, Axios |
| **Image Processing** | Sharp, Canvas |
| **Environment Config** | dotenv |

## 📋 Prasyarat Instalasi

Sebelum menginstal, pastikan sistem Anda memenuhi persyaratan berikut:

- **Node.js** versi 18 atau lebih tinggi
- **npm** atau **yarn** (package manager)
- **Git** (untuk clone repository)
- **MongoDB** (opsional, bisa menggunakan Local JSON)
- **MySQL** (opsional, alternatif database)
- **FFmpeg** (untuk processing media - converter & downloader)
- **PM2** (opsional, untuk deployment 24/7)

### Instalasi Dependencies Sistem

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm git ffmpeg

# Windows (menggunakan chocolatey)
choco install nodejs git ffmpeg

# macOS (menggunakan homebrew)
brew install node git ffmpeg
```

## 📁 Susunan Project

```
yuxin-whatsapp-bot/
├── .env.example              # Contoh file konfigurasi environment
├── .gitignore               # File yang diabaikan oleh Git
├── ecosystem.config.cjs     # Konfigurasi PM2 untuk deployment
├── package.json             # Informasi dependensi dan script
├── README.md                # Dokumentasi project
└── src/                     # Direktori utama source code
    ├── config/              # Konfigurasi statis bot
    │   └── index.js         # Pengaturan nama, owner, prefix, dll
    ├── core/                # Logika inti aplikasi
    │   ├── connect.js       # Koneksi WhatsApp menggunakan Baileys
    │   └── message.js       # Handler pemrosesan pesan masuk
    ├── database/            # Penyimpanan database lokal (JSON)
    ├── lib/                 # Pustaka internal
    │   ├── database/        # Database drivers & models
    │   │   ├── drivers/     # MongoDB & Local drivers
    │   │   └── models/      # Skema (User, Group, Settings, Session)
    │   ├── scrapers/        # Web scraper untuk anime & downloader
    │   ├── schema/          # Validasi skema data
    │   └── uploader/        # Modul upload media
    ├── plugins/             # Kumpulan fitur/perintah bot
    │   ├── ai/              # Fitur Artificial Intelligence
    │   ├── anime/           # Fitur Anime (Anichin scraper)
    │   ├── convert/         # Converter media
    │   ├── digi/            # Integrasi PPOB Digiflazz
    │   ├── downloader/      # Downloader multi-platform
    │   ├── group/           # Manajemen grup WhatsApp
    │   ├── misc/            # Fitur miscellaneous
    │   ├── owner/           # Perintah khusus owner
    │   └── tools/           # Alat bantu tambahan
    ├── utils/               # Fungsi utilitas
    │   ├── api/             # API request handlers
    │   ├── converter/       # Media conversion utilities
    │   └── digiflazz.js     # Integrasi Digiflazz API
    └── main.js              # Entry point aplikasi
```

## 🚀 Instalasi & Konfigurasi

### 1. Clone Repository

```bash
git clone https://github.com/liwirya/yuxin-whatsapp-bot.git
cd yuxin-whatsapp-bot
```

### 2. Instal Dependensi

```bash
npm install
# atau
yarn install
```

### 3. Konfigurasi Environment

```bash
# Copy file contoh environment
cp .env.example .env

# Edit file .env dengan editor favorit Anda
nano .env
```

**Variabel Environment yang Perlu Diisi:**

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
# atau untuk MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=yuxin_bot

# API Keys
DIGIFLAZZ_USERNAME=your_digiflazz_username
DIGIFLAZZ_API_KEY=your_digiflazz_api_key
OPENAI_API_KEY=your_openai_api_key

# Bot Configuration
BOT_NAME=YuXin
OWNER_NUMBER=628xxxxxxxxxx
PREFIX=!
```

### 4. Konfigurasi Bot

Edit file `src/config/index.js` untuk mengatur:

```javascript
module.exports = {
    botName: 'YuXin',
    ownerNumber: ['628xxxxxxxxxx@s.whatsapp.net'],
    prefix: ['!', '.', '/'],
    // ... pengaturan lainnya
}
```

### 5. Jalankan Bot

**Mode Development:**
```bash
npm start
# atau
node src/main.js
```

**Mode Production (dengan PM2):**
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 💬 Contoh Penggunaan

### Perintah Dasar

| Perintah | Deskripsi | Contoh |
|----------|-----------|--------|
| `!menu` | Menampilkan daftar menu | `!menu` |
| `!help` | Bantuan penggunaan | `!help` |

### AI & Chat

| Perintah | Deskripsi | Contoh |
|----------|-----------|--------|
| `!gpt <pertanyaan>` | Chat dengan AI | `!gpt apa itu Node.js?` |

### Converter

| Perintah | Deskripsi | Contoh |
|----------|-----------|--------|
| `!sticker` | Buat stiker dari gambar/video | Kirim gambar dengan caption `!sticker` |
| `!brat <teks>` | Buat stiker brat | `!brat Hello World` |
| `!toaudio` | Konversi video ke audio | Reply video dengan `!toaudio` |

### Downloader

| Perintah | Deskripsi | Contoh |
|----------|-----------|--------|
| `!tiktok <url>` | Download video TikTok | `!tiktok https://vt.tiktok.com/xxxxx` |
| `!ig <url>` | Download post Instagram | `!ig https://instagram.com/p/xxxxx` |
| `!ytmp4 <url>` | Download video YouTube | `!ytmp4 https://youtube.com/watch?v=xxxxx` |
| `!spotify <url>` | Download lagu Spotify | `!spotify https://open.spotify.com/track/xxxxx` |

### Group Management (Hanya Admin)

| Perintah | Deskripsi | Contoh |
|----------|-----------|--------|
| `!add <nomor>` | Tambah member | `!add 628xxxxxxxxxx` |
| `!kick @tag` | Keluarkan member | `!kick @user` |
| `!promote @tag` | Jadikan admin | `!promote @user` |
| `!demote @tag` | Turunkan admin | `!demote @user` |
| `!tagall` | Tag semua member | `!tagall` |
| `!setppgc` | Ubah foto grup | Kirim gambar dengan `!setppgc` |

### PPOB (Digiflazz)

| Perintah | Deskripsi | Contoh |
|----------|-----------|--------|
| `!harga` | Cek harga produk | `!harga pulsa` |
| `!saldo` | Cek saldo Digiflazz | `!saldo` |

### Owner Only

| Perintah | Deskripsi | Contoh |
|----------|-----------|--------|
| `!eval <kode>` | Jalankan kode JS | `!eval console.log('test')` |
| `!exec <perintah>` | Jalankan shell command | `!exec ls -la` |
| `!ban @tag` | Ban pengguna | `!ban @user` |
| `!settings` | Ubah pengaturan bot | `!settings public` |

---

<div align="center">
  <p>Dibuat dengan oleh <strong>Liwirya</strong></p>
  <p>
    <a href="https://github.com/liwirya/yuxin-whatsapp-bot">GitHub</a> •
    <a href="https://github.com/liwirya/yuxin-whatsapp-bot/issues">Issues</a> •
    <a href="https://github.com/liwirya/yuxin-whatsapp-bot/discussions">Discussions</a>
  </p>
</div>
