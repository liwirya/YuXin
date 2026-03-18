# 🤖 YuXin WhatsApp Bot

YuXin adalah implementasi bot WhatsApp modular berbasis Node.js yang dirancang dengan arsitektur *plugin-based* untuk skalabilitas dan pemeliharaan tingkat lanjut. Proyek ini tidak hanya sekadar skrip bot; ia mengintegrasikan berbagai kapabilitas, mulai dari kecerdasan buatan, pemrosesan media tingkat lanjut, integrasi PPOB, hingga manajemen sistem secara dinamis.

## ⚡ Fitur Utama

Sistem ini beroperasi dengan memuat plugin secara dinamis, menawarkan kapabilitas berikut:
- **🧠 Integrasi AI**: Interaksi data dan teks cerdas menggunakan modul GPT-based.
- **📥 Universal Downloader**: Ekstraksi media dari platform mayor (Facebook, Instagram, Pinterest, Spotify, Threads, TikTok, Twitter/X, YouTube).
- **🔄 Media Converter & Manipulation**: Transcoding dan manipulasi presisi tinggi (Sticker maker, Video/Audio/Image converter, Brat generator, filter efek).
- **💳 Integrasi PPOB (Digiflazz)**: Pengecekan harga dan saldo secara real-time langsung melalui protokol API Digiflazz.
- **🛡️ Group Management Protocol**: Otomatisasi moderasi grup (Kick, Promote, Demote, Everyone, Set P/P).
- **🛠️ Owner & System Utilities**: Eksekusi kode dinamis (Eval/Exec), manajemen sesi (Ban/Clear Chat), serta manipulasi file *on-the-fly*.

## 💻 Teknologi yang Digunakan

Arsitektur YuXin dibangun di atas fondasi teknologi modern dan efisien:
- **[Node.js](https://nodejs.org/)**: Runtime environment utama.
- **[ES Modules (ESM)](https://nodejs.org/api/esm.html)**: Standar ekspor/impor ECMAScript untuk efisiensi modul.
- **Database System**: Mendukung skema penyimpanan ganda (Local JSON & MongoDB untuk state authentication).
- **PM2**: Proses manajer untuk eksekusi latar belakang dan *auto-restart* (`ecosystem.config.cjs`).
- **ESLint & Prettier**: Penegakan standar kode yang ketat untuk stabilitas *codebase*.

## ⚙️ Prasyarat Instalasi

Sebelum menginisialisasi sistem ini, pastikan infrastruktur lokal atau server telah memenuhi persyaratan absolut berikut:
- **Node.js**: Versi `18.x` atau lebih baru (wajib untuk dukungan ESM penuh).
- **Git**: Untuk manajemen repositori.
- **FFmpeg & ImageMagick**: Diperlukan untuk *core rendering* dan konversi media biner (stiker, transcode video/audio).
- **MongoDB URI** *(Opsional)*: Jika arsitektur mengandalkan cluster MongoDB untuk autentikasi yang lebih handal dari *file-based state*.

## 📂 Susunan Project

Hierarki direktori disusun untuk pemisahan *concern* (*separation of concerns*) yang jelas guna efisiensi operasional dan pengembangan:

```text
YuXin/
├── .env.example             # Template variabel lingkungan (API Keys, Config)
├── ecosystem.config.cjs     # Konfigurasi PM2 Process Manager
├── eslint.config.mjs        # Aturan linter statis
├── package.json             # Dependensi dan metadata proyek
└── src/                     # Source Code Utama
    ├── config/              # Parameter konfigurasi statis (stiker, general)
    ├── core/                # Inti protokol koneksi dan sistem parsing pesan
    ├── database/            # Penyimpanan state lokal (JSON)
    ├── lib/                 # Pustaka utilitas (Auth, Scrapers, DB Models, Yt-dlp)
    ├── plugins/             # Modul fungsional yang dimuat dinamis
    │   ├── _auto/           # Plugin otomatisasi *background task*
    │   ├── ai/              # Integrasi sistem kecerdasan buatan
    │   ├── convert/         # Manipulasi dan konversi format file
    │   ├── digi/            # Layanan utilitas transaksi PPOB
    │   ├── downloader/      # Ekstraktor sumber daya dan media eksternal
    │   ├── group/           # Perintah moderasi dan operasi grup
    │   ├── info/            # Metrik dan statistik bot
    │   ├── misc/            # Plugin operasional tambahan
    │   ├── owner/           # Utilitas absolut admin/developer
    │   └── tools/           # Alat bantu fungsional umum (Lirik, OCR, API Fetcher)
    ├── utils/               # Modul helper eksternal (Konverter, Digiflazz handler)
    └── main.js              # Titik masuk (Entry point) inisialisasi aplikasi
```

## 🚀 Instalasi & Contoh Penggunaan

Ikuti alur eksekusi ini dengan presisi untuk memastikan sistem berjalan tanpa distorsi.

1. **Kloning Repositori**
   Ambil *source code* secara langsung menggunakan git.
   ```bash
   git clone [https://github.com/USERNAME/YuXin.git](https://github.com/USERNAME/YuXin.git)
   cd YuXin
   ```

2. **Instalasi Dependensi**
   Populasikan modul-modul yang dibutuhkan oleh *package.json*.
   ```bash
   npm install
   ```

3. **Konfigurasi Lingkungan**
   Konfigurasikan kunci rahasia (*secret keys*) dan parameter esensial sistem.
   ```bash
   cp .env.example .env
   ```
   *(Modifikasi isi dari `.env` dengan kredensial API, nomor developer, dan pengaturan sistem lainnya yang sesuai).*

4. **Inisialisasi Sistem**
   - **Mode Development/Manual:**
     ```bash
     npm start
     ```
   - **Mode Production (Optimasi via PM2):**
     ```bash
     pm2 start ecosystem.config.cjs
     ```

**Eksekusi Perintah (Contoh Penggunaan):**
Setelah otentikasi sesi berhasil dijalankan dengan WhatsApp (via *pairing code* atau metode login yang disediakan), interaksi sistem dapat dipanggil dengan *prefix* yang dikonfigurasi.
- Mengakses dokumentasi / menu dasar: `!help` atau `.menu`
- Menginisiasi unduhan media: `!tiktok <url_video>` atau `!ig <url_post>`
- Interaksi intelijen buatan: `!gpt Jelaskan struktur data secara ringkas`
- Konversi media ke stiker: Kirim/Reply gambar dengan *caption* `!sticker`

## 🤝 Kontribusi

Arsitektur sistem ini masih terbuka untuk optimasi lanjutan. Jika Anda mampu mengembangkan fungsi baru atau merekayasa ulang algoritma yang tidak efisien:
1. Lakukan *Fork* pada repositori ini.
2. Buat *branch* fitur Anda (`git checkout -b feature/OptimasiKrusial`).
3. Terapkan perubahan dan *commit* dengan deskripsi teknis yang jelas (`git commit -m 'feat: Integrasi metode caching presisi tinggi'`).
4. Unggah ke branch Anda (`git push origin feature/OptimasiKrusial`).
5. Buat dan ajukan *Pull Request* untuk evaluasi logis.

## 📄 Lisensi

Sistem ini didistribusikan di bawah protokol standar **MIT License**.

```text
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
