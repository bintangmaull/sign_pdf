# 🛡️ PDF Editor Pro — All-in-One Windows Offline Studio

<div align="center">

![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D4?style=for-the-badge&logo=windows&logoColor=white)
![Mode](https://img.shields.io/badge/Processing-100%25%20Offline%20%26%20Private-10B981?style=for-the-badge&logo=shield&logoColor=white)
![Engine](https://img.shields.io/badge/Desktop%20Engine-Electron%20%7C%20HTML5-8B5CF6?style=for-the-badge&logo=electron&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-EC4899?style=for-the-badge)

**Aplikasi Desktop Windows berkinerja tinggi berbasis HTML/CSS/JS & Electron untuk menyunting, menggabungkan, memampatkan, dan mengonversi dokumen PDF dengan privasi 100% lokal di komputer Anda.**

</div>

---

## ✨ Mengapa PDF Editor Pro?

Sebagian besar alat PDF saat ini mengharuskan Anda mengunggah dokumen penting ke server cloud eksternal atau membayar langganan bulanan yang mahal. **PDF Editor Pro** dirancang untuk memberi Anda kendali penuh atas dokumen sensitif Anda:
- **🔒 Privasi 100% Lokal & Offline:** Seluruh operasi manipulasi PDF diproses langsung di dalam memori komputer Windows Anda tanpa koneksi internet atau server pihak ketiga.
- **⚡ Super Cepat & Ringan:** Arsitektur modular berbasis *Vanilla JS* & *PDF-Lib* membuat pemrosesan dokumen instan tanpa jeda.
- **💼 Siap Pakai Portable:** Dapat dibuka instan via *Silent Script launcher* ataupun dipaketkan menjadi 1 file `.exe` portable tunggal.

---

## 🌟 6 Fitur Unggulan (All-in-One Studio Suite)

Dilengkapi dengan antarmuka bergaya kartu modern *Glassmorphism*, **PDF Editor Pro** menyediakan 6 alat profesional dalam satu dasbor terpadu:

### 1. ✏️ Edit PDF & Tanda Tangan *(Interactive Editor)*
- **Tanda Tangan Digital Multi-Mode:**
  - **Draw:** Lukis tangan tanda tangan langsung di atas kanvas dengan pilihan ketebalan pena & 4 warna tinta resmi.
  - **Type:** Ketik nama dengan 4 pilihan font kaligrafi sambung elegan (*Great Vibes*, *Pacifico*, *Caveat*, *Dancing Script*).
  - **Upload:** Unggah gambar stempel atau cap perusahaan berlatar transparan (PNG/JPG/WebP).
- **Anotasi Teks Bebas:** Sisipkan catatan teks, nama, atau keterangan tambahan di halaman manapun dengan kustomisasi ukuran & warna.
- **Stempel Bisnis & Tanggal Kilat:** Sisipkan stempel resmi (**DISETUJUI**, **LUNAS**, **RAHASIA**, **SEMENTARA**) atau cap tanggal hari ini hanya dengan 1 klik.
- **Rotasi & Hapus Halaman:** Putar halaman aktif sebesar 90° atau hapus halaman tertentu saat menyunting.

### 2. 📑 Gabungkan PDF *(Merge PDF)*
- Satukan beberapa file dokumen PDF terpisah menjadi 1 file utuh secara runtut.
- Dukungan *drag-and-drop* banyak file sekaligus dengan kontrol geser urutan (*move up / move down*) sebelum proses penggabungan.

### 3. ✂️ Hapus & Atur Halaman *(Remove Pages)*
- Tampilkan *grid thumbnail* interaktif dari seluruh halaman dokumen PDF Anda.
- Pilih halaman-halaman yang ingin dibuang (halaman kosong, iklan, atau sampul) dan simpan PDF bersihnya seketika.

### 4. 🗜️ Kompres PDF *(Compress PDF)*
- Kurangi ukuran file dokumen PDF Anda agar hemat ruang simpan dan mudah dikirim melalui email atau WhatsApp.
- **3 Tingkat Kompresi:**
  - **Ringan:** Kualitas ketajaman gambar maksimal.
  - **Optimal *(Disarankan)*:** Keseimbangan terbaik antara ukuran file ringkas dan keterbacaan teks.
  - **Ekstra:** Kompresi maksimal untuk file dokumen hasil scan berukuran besar.

### 5. 🖼️ PDF ke Gambar *(PDF to PNG / JPG)*
- Ekstrak seluruh halaman dari dokumen PDF menjadi file gambar beresolusi tinggi.
- Dokumen dengan banyak halaman otomatis dikemas dalam file arsip **ZIP** agar mudah diunduh sekaligus.

### 6. 📄 Gambar ke PDF *(Image to PDF)*
- Ubah foto dokumen, KTP, atau gambar apapun (JPG, PNG, WebP) menjadi satu dokumen PDF standar profesional.
- Mendukung penggabungan banyak foto sekaligus dalam 1 album/dokumen.

---

## 🏗️ Struktur Arsitektur Kode Modular

Proyek ini dibangun dengan arsitektur **Clean Code Modular**, memisahkan antarmuka, penataan gaya (*styling*), dan logika pemrosesan (*logic*) agar mudah dipahami, dikembangkan, dan dirawat:

```
PDF Editor/
├── index.html                   # Shell UI Utama (Dashboard 6 Alat & Workspace Kontainer)
├── PDF_Editor_Silent.vbs        # Windows Launcher Portable Tanpa Jendela Hitam CMD
├── PDF_Editor.bat               # Windows Desktop App Launcher Standar
├── package.json                 # Konfigurasi Build Executable Portable (.exe) via Electron
├── main.js                      # Electron Main Process Entry Point
├── README.md                    # Dokumentasi Proyek
│
├── assets/                      # Aset Gambar & Media
│   └── qrdonate.png             # Kode QR Donasi / Dukungan Proyek
│
├── css/                         # Modul Styling Vanilla CSS
│   ├── variables.css            # Desain System Tokens (Warna, HSL, Font, Shadow)
│   ├── layout.css               # Shell Layout, Header, & Responsive Grid
│   ├── components.css           # Tombol, Kartu, Input, Badge, & Toast
│   ├── editor.css               # Tampilan Workspace Interactive Editor PDF
│   ├── tools.css                # Tampilan Workspace Merge, Remove Pages, Compress, & Convert
│   └── modals.css               # Tampilan Modal Tanda Tangan, Panduan, & Donasi
│
└── js/                          # Modul Logika JavaScript
    ├── config.js                # Konfigurasi Utama Aplikasi & Variabel Global
    ├── utils.js                 # Fungsi Bantu (File Picker, Toast, Format Ukuran, Canvas)
    ├── tool-editor.js           # Engine Interactive PDF Editor & Tanda Tangan
    ├── tool-merge.js            # Engine Penggabungan File PDF
    ├── tool-pages.js            # Engine Hapus & Penataan Halaman PDF
    ├── tool-compress.js         # Engine Kompresi & Pemampatan PDF
    ├── tool-converter.js        # Engine Konversi PDF ke Gambar & Gambar ke PDF
    └── main.js                  # Routing Dasbor & Event Listener Utama
```

---

## 🚀 Cara Menjalankan Aplikasi di Windows

### Cara 1: Silent Launcher Desktop *(Sangat Disarankan)*
1. Klik ganda pada file **`PDF_Editor_Silent.vbs`**.
2. Aplikasi akan otomatis terbuka langsung dalam jendela desktop Windows modern **tanpa memunculkan jendela hitam terminal/CMD sama sekali**.

### Cara 2: Membangun File Portable Mandiri (`.EXE`)
Jika Anda ingin menghasilkan **1 file `.exe` mandiri** yang bisa disimpan di Flashdisk atau didistribusikan ke komputer Windows mana pun:
1. Pastikan **Node.js** telah terinstal di komputer Anda.
2. Buka terminal di folder proyek ini dan jalankan perintah:
   ```bash
   npm install
   npm run build:portable
   ```
3. File executable portable siap digunakan di dalam folder **`dist/`**.

### Cara 3: Membuka Langsung Melalui Browser
1. Klik ganda pada file **`index.html`** atau klik kanan ➔ **Open with** ➔ Pilih browser modern (Google Chrome, Microsoft Edge, atau Firefox).

---

## 💾 Dialog Penyimpanan Modern (Save As)

Seluruh fitur ekspor pada aplikasi ini telah terintegrasi dengan **Modern File System Access API (`showSaveFilePicker`)**. Setiap kali Anda menyimpan dokumen hasil suntingan, penggabungan, kompresi, atau konversi:
- Jendela standar Windows **Save As** akan otomatis muncul.
- Anda bebas memilih folder penyimpanan tujuan (Desktop, Documents, Flashdisk, dsb.).
- Anda dapat memberi nama file baru sesuai keinginan sebelum disimpan.

---

## 🛠️ Teknologi & Library Internal
- **HTML5 Canvas API:** Rendering visual halaman PDF dan manipulasi gambar lokal.
- **Vanilla CSS3 & HSL Design System:** Desain *Glassmorphism*, transisi responsif, dan *Dark Theme* profesional.
- **PDF.js (Mozilla):** Engine pemindaian dan rendering vektor dokumen PDF secara lokal.
- **PDF-Lib:** Manipulasi struktur PDF tingkat lanjut (menggabungkan, menyunting, anotasi, dan stempel).
- **JSZip:** Pengemasan multi-halaman hasil konversi gambar ke dalam arsip ZIP secara *client-side*.
- **Electron:** Runtime pembungkus desktop Windows portable.

---

<div align="center">

**PDF Editor Pro** — Dirancang untuk kecepatan, kemudahan, dan privasi penuh dokumen Anda.

</div>
