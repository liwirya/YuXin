# 📚 Dokumentasi Proyek: YuXin WhatsApp Bot

**YuXin** adalah bot WhatsApp cerdas berbasis Node.js yang dibangun menggunakan library **Baileys**. Bot ini dirancang dengan arsitektur modular (sistem plugin) sehingga sangat mudah untuk dikembangkan, dipelihara, dan diskalakan. Bot ini mendukung integrasi database ganda (MongoDB/MySQL & Lokal) serta dilengkapi dengan berbagai fitur seperti AI, Downloader, Manajemen Grup, hingga integrasi PPOB (Digiflazz).

---

## 🏗️ 1. Arsitektur & Struktur Direktori

Proyek ini menggunakan struktur folder yang memisahkan antara konfigurasi, logika inti, utilitas, dan fitur (plugin). Hal ini membuat kode menjadi sangat rapi.

```text
yuxin-whatsapp-bot/
├── .env.example          # Contoh file konfigurasi environment
├── ecosystem.config.cjs  # Konfigurasi untuk PM2 (Deployment)
├── package.json          # Informasi dependensi project
└── src/                  # Direktori utama source code
    ├── config/           # Konfigurasi statis bot (Nama, Owner, Setting Stiker)
    ├── core/             # Logika inti (Koneksi WA & Pemrosesan Pesan)
    ├── database/         # Penyimpanan database lokal statis (JSON)
    ├── lib/              # Pustaka internal (Database, Scraper, Skema, Uploader)
    ├── plugins/          # Kumpulan fitur/perintah bot yang dibagi per kategori
    ├── utils/            # Fungsi utilitas (API request, Converter, Digiflazz)
    └── main.js           # Entry point (Titik awal jalannya aplikasi)
```

---

## ⚙️ 2. Alur Logika (Core Logic)

Bagaimana bot menerima dan merespons pesan? Berikut adalah alur kerja utamanya:

1. **Inisialisasi (`src/main.js`)**: 
   Saat aplikasi dijalankan, `main.js` akan memuat konfigurasi, menghubungkan database, dan memanggil fungsi koneksi dari `core/connect.js`.
2. **Koneksi WhatsApp (`src/core/connect.js`)**:
   - Modul ini menggunakan *Baileys* untuk menghubungkan bot ke server WhatsApp.
   - Mengelola *state* autentikasi (menyimpan sesi login agar tidak perlu scan QR/Pairing terus-menerus).
   - Mendengarkan event (kejadian) dari WhatsApp, seperti pesan masuk (`messages.upsert`).
3. **Pemrosesan Pesan (`src/core/message.js`)**:
   - Setiap pesan baru akan dilempar ke `message.js`.
   - Modul ini bertugas mengekstrak teks pesan, mengecek apakah pesan tersebut memiliki **Prefix** (awalan perintah seperti `!`, `.`, atau `/`).
   - Melakukan validasi dasar: *Apakah pengirim adalah owner? Apakah pengirim sedang di-ban? Apakah pesan dikirim di dalam grup?*
   - Jika valid, sistem akan mencari *plugin* yang cocok dengan perintah tersebut dan mengeksekusinya.

---

## 🧩 3. Modul dan Fitur (Plugins)

Fitur-fitur bot diletakkan di dalam folder `src/plugins/` dan dikelompokkan berdasarkan fungsinya agar terorganisir dengan baik.

### 🤖 A. Artificial Intelligence (`/ai`)
Menggunakan API pihak ketiga untuk memberikan respons cerdas.
* **gpt.js**: Chatbot berbasis AI untuk menjawab pertanyaan umum.

### 🎬 B. Anime (`/anime`)
Fitur untuk para pecinta anime (terintegrasi dengan scraper Anichin).
* **anichinc.js / anichinep.js / anichingo.js / anichins.js**: Modul untuk mencari judul anime, mengecek episode terbaru, dan mendapatkan link terkait.

### 🔄 C. Converter (`/convert`)
Modul untuk memanipulasi file media.
* **sticker.js**: Mengubah gambar/video singkat menjadi stiker WhatsApp.
* **toaudio.js / toimage.js / tovideo.js**: Mengonversi format media satu sama lain (misal: stiker bergerak menjadi video).
* **brat.js**: Membuat stiker/gambar bergaya tren "Brat".
* **effects.js**: Memberikan filter/efek pada gambar.

### 💳 D. Digital / PPOB (`/digi`)
Integrasi dengan layanan PPOB **Digiflazz** untuk transaksi digital.
* **harga.js**: Mengecek daftar harga produk digital (pulsa, kuota, game).
* **saldo.js**: Mengecek sisa saldo Digiflazz bot.

### 📥 E. Downloader (`/downloader`)
Mengunduh media dari berbagai platform sosial media.
* Mendukung platform populer: **TikTok, Instagram, Facebook, Twitter (X), Spotify, Pinterest, Threads, dan Mediafire**.
* Logika downloader memanfaatkan scraper di `src/lib/scrapers/` atau menggunakan pustaka `yt-dlp`.

### 👥 F. Group Management (`/group`)
Otomatisasi dan pengelolaan grup WhatsApp (Hanya bisa digunakan jika bot adalah Admin).
* **add.js / kick.js**: Menambah atau mengeluarkan member.
* **promote.js / demote.js**: Menaikkan/menurunkan jabatan admin.
* **everyone.js**: Tagging (menyebut) seluruh anggota grup (Tag All).
* **setppgc.js**: Mengubah foto profil grup.

### 👑 G. Owner / Developer (`/owner`)
Perintah khusus yang *hanya* bisa diakses oleh Wira (Developer/Owner).
* **eval.js / exec.js**: Menjalankan kode JavaScript atau perintah Terminal/Shell langsung dari WhatsApp (Sangat berguna untuk *debugging*).
* **ban.js**: Memblokir pengguna agar tidak bisa menggunakan bot.
* **clearchat.js**: Membersihkan riwayat obrolan bot.
* **setpp.js**: Mengganti foto profil bot.
* **settings.js**: Mengubah pengaturan bot secara dinamis.

### 🛠️ H. Tools & Misc (`/tools` & `/misc`)
Kumpulan alat bantu tambahan.
* **lyrics.js**: Mencari lirik lagu.
* **whatmusic.js**: Mengidentifikasi lagu dari audio (seperti Shazam).
* **screenshot.js**: Mengambil screenshot dari sebuah website.
* **delmsg.js / rvo.js**: Menghapus pesan atau membaca pesan "View Once" (Sekali Lihat).

---

## 🗄️ 4. Skema Database & Penyimpanan

Proyek ini menggunakan fleksibilitas database melalui folder `src/lib/database/`.

1.  **Driver Database**:
    * Terdapat dukungan untuk **MongoDB** (melalui Mongoose) dan **Local JSON** sebagai cadangan/alternatif jika database awan tidak tersedia.
2.  **Model Skema (`src/lib/database/models/`)**:
    * **User**: Menyimpan data pengguna (XP, limit harian, status premium, status ban).
    * **Group**: Menyimpan pengaturan spesifik per grup (apakah mode *nsfw* aktif, apakah fitur *antilink* nyala).
    * **Settings**: Menyimpan konfigurasi global bot (status publik/self).
    * **Session**: Mengamankan data sesi koneksi Baileys ke dalam database agar tidak hilang saat server di-*restart*.

---

## 🚀 5. Panduan Konfigurasi & Menjalankan Bot

Untuk mengatur proyek ini, pengembang atau kontributor dapat mengikuti langkah berikut:

### Konfigurasi Awal
1. Salin file konfigurasi *environment*:
   `cp .env.example .env`
2. Buka `.env` dan isi variabel yang dibutuhkan:
   * URL MongoDB/MySQL.
   * API Key (seperti Digiflazz, API Scraper, dll).
3. Buka `src/config/index.js` untuk mengatur:
   * Nama Bot (YuXin).
   * Nomor Pemilik (Owner Number).
   * Prefix default.

### Instalasi & Menjalankan
1. Pastikan **Node.js** terinstal.
2. Instal dependensi menggunakan npm atau yarn:
   ```bash
   npm install
   ```
3. Jalankan bot:
   ```bash
   npm start
   ```
   *(Atau gunakan PM2 dengan `ecosystem.config.cjs` untuk berjalan di latar belakang (background) selama 24/7).*
