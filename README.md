# PDF Editor Pro - All-in-One Windows Offline Studio (HTML-Based)

**PDF Editor Pro** adalah aplikasi desktop Windows berbasis HTML/CSS/JavaScript modular yang lengkap, modern, dan sangat cepat untuk mengelola, menyunting, menggabungkan, memampatkan, dan mengonversi dokumen PDF maupun gambar. Seluruh pemrosesan dilakukan **100% lokal di komputer Windows Anda tanpa memerlukan instalasi server atau koneksi internet (100% Offline & Private)**.

---

## 🌟 7 Fitur Unggulan (All-in-One Studio Suite)

Aplikasi ini dilengkapi dengan **Menu Utama (Dashboard)** bergaya kartu modern tempat Anda dapat dengan mudah memilih dari 7 alat profesional:

1. **✏️ Edit PDF & Tanda Tangan (Interactive Editor):**
   - **Tanda Tangan Digital:** Lukis tangan (Draw), ketik nama dengan 4 font sambung elegan (Type), atau unggah stempel gambar (Upload).
   - **Anotasi Teks Bebas:** Sisipkan catatan teks atau nama di mana saja pada halaman dengan pilihan ukuran dan warna tinta.
   - **Stempel & Tanggal:** Sisipkan cap bisnis cepat (**DISETUJUI, LUNAS, RAHASIA, SEMENTARA**) atau stempel tanggal hari ini hanya dengan 1 klik.
   - **Rotasi & Hapus Halaman:** Putar halaman aktif sebesar 90° atau hapus halaman langsung dari editor.
2. **📑 Gabungkan PDF (Merge PDF):**
   - Satukan beberapa file PDF menjadi 1 dokumen utuh.
   - Atur urutan file dengan mudah sebelum penggabungan menggunakan tombol geser ke atas/bawah.
3. **✂️ Hapus & Atur Halaman (Remove Pages):**
   - Tampilkan thumbnail seluruh halaman PDF dalam bentuk grid interaktif.
   - Pilih halaman-halaman yang ingin dibuang (misal: halaman kosong / sampul) dan simpan PDF bersihnya.
4. **🗜️ Kompres PDF (Compress PDF):**
   - Kurangi ukuran file dokumen PDF Anda agar hemat memori dan mudah dikirim via email/WhatsApp.
   - 3 Tingkat Pilihan: **Kompresi Ringan**, **Optimal (Disarankan)**, dan **Kompresi Ekstra**.
5. **🖼️ PDF ke Gambar (PDF to PNG / JPG):**
   - Ekstrak seluruh halaman dari dokumen PDF menjadi file gambar resolusi tinggi.
   - Otomatis dikemas dalam format **ZIP** jika dokumen memiliki banyak halaman.
6. **📄 Gambar ke PDF (Image to PDF):**
   - Ubah foto dokumen, KTP, atau gambar apapun (JPG, PNG, WebP) menjadi dokumen PDF standar.
   - Mendukung penggabungan banyak foto sekaligus menjadi 1 album/dokumen PDF.
7. **📝 PDF ke Word (.doc):**
   - Ekstrak seluruh teks dan struktur kalimat dari dalam dokumen PDF menjadi file Microsoft Word (`.doc`) yang dapat dibuka dan diedit di Office Word.

---

## 🏗️ Arsitektur Kode Modular (Clean Code structure)

Agar kode sangat rapi, mudah dipelajari, dan mudah dikembangkan Tanpa file monolitik yang panjang, proyek ini diorganisasikan ke dalam folder modular:

```
e:\Iseng\TTD\
│
├── index.html                  # Shell UI Utama (Dashboard 6 Alat + Workspace Kontainer)
├── PDF_Editor.bat              # Windows Desktop App Launcher (Mode Jendela Asli Windows)
├── PDF_Editor_Silent.vbs       # Launcher Desktop Tanpa Jendela Hitam CMD (Portable Instan)
├── package.json                # Konfigurasi Build Aplikasi Portable (.exe) dengan Electron
├── main.js                     # Electron Main Process Entry Point
├── README.md                   # Dokumentasi Lengkap
│
├── css/                        # Folder Modul Styling
├── js/                         # Folder Modul Logika JavaScript
```

---

## 🚀 Cara Menjalankan Aplikasi di Windows (Tanpa Instalasi)

### Cara 1: Launcher Desktop Tanpa Jendela Hitam (Sangat Disarankan - Langsung Pakai)
1. Klik ganda pada file **`PDF_Editor_Silent.vbs`**.
2. Aplikasi akan otomatis terbuka di jendela desktop profesional Windows **tanpa muncul jendela hitam terminal/CMD sama sekali**.

### Cara 2: Membangun File Portable Mandiri (`.EXE` Tunggal)
Jika Anda ingin memiliki **1 file `.exe` mandiri** (berisi engine internal sendiri) yang bisa disimpan di Flashdisk atau dijalankan di PC mana pun tanpa bergantung pada browser:
1. Pastikan **Node.js** sudah terinstal di komputer Anda.
2. Buka terminal di folder aplikasi ini dan jalankan perintah:
   ```bash
   npm install
   npm run build:portable
   ```
3. File executable portable mandiri siap digunakan di dalam folder **`dist/`**!

### Cara 3: Membuka Langsung Melalui Browser
1. Klik ganda pada file **`index.html`** atau klik kanan -> *Open with* -> pilih Google Chrome, Microsoft Edge, atau Firefox.

---

## 💾 Fitur Pemilihan Folder Penyimpanan (Save As)
Seluruh alat ekspor di aplikasi ini telah didukung oleh **Modern File System Access API (`showSaveFilePicker`)**. Ketika Anda mengklik tombol simpan di alat manapun, jendela dialog standar Windows **Save As** akan langsung terbuka sehingga Anda dapat:
- Memilih direktori/folder penyimpanan tujuan (Documents, Desktop, Flashdisk, dll.).
- Mengubah nama file hasil akhir sesuai keinginan sebelum disimpan.

---

## 🛠️ Teknologi & Library Eksternal yang Digunakan
* **HTML5 Canvas:** Untuk melukis tanda tangan, merender halaman PDF, dan mengonversi gambar.
* **Vanilla CSS3 & HSL Tokens:** Untuk desain bergaya *Glassmorphism*, animasi halus, dan multi-tema (Dark/Light Mode).
* **PDF.js (Mozilla):** Membaca dan merender vektor halaman PDF secara lokal di browser.
* **PDF-Lib:** Memanipulasi struktur PDF (menggabungkan, menyisipkan gambar/teks/stempel, menghapus halaman).
* **JSZip:** Mengemas hasil ekstraksi gambar multi-halaman ke dalam arsip ZIP secara client-side.
