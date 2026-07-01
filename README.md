# SignaDoc Pro - Aplikasi Tanda Tangan Dokumen Windows (HTML-Based)

SignaDoc Pro adalah aplikasi desktop berbasis HTML/CSS/JavaScript yang ringan, modern, dan aman untuk menambahkan tanda tangan digital (e-signature) ke atas dokumen **PDF** maupun **Gambar (PNG/JPG)** langsung di sistem operasi Windows Anda tanpa memerlukan instalasi server atau koneksi internet (100% offline & lokal).

---

## 🌟 Fitur Utama

1. **🔒 Privasi 100% Lokal (Offline):** Dokumen Anda tidak pernah diunggah ke server cloud manapun. Seluruh proses pembacaan, penempelan tanda tangan, dan ekspor PDF dilakukan langsung di dalam komputer Windows Anda.
2. **✍️ 3 Metode Pembuatan Tanda Tangan:**
   - **Gambar Langsung (Draw):** Gunakan mouse, touchpad, atau layar sentuh untuk menggambar tanda tangan. Pilihan warna tinta (Hitam, Biru, Merah, Hijau) dan ketebalan pena dapat disesuaikan.
   - **Ketik Nama (Type):** Ketik nama Anda dan pilih dari 4 pilihan *font sambung / cursive* yang elegan (Great Vibes, Pacifico, Caveat, Dancing Script).
   - **Unggah Gambar (Upload):** Gunakan gambar stempel atau tanda tangan yang sudah Anda miliki (format PNG transparan sangat disarankan).
3. **📄 Dukungan Multi-Format & Multi-Halaman:**
   - Mendukung file **PDF** hingga puluhan halaman dengan navigasi halaman yang mudah.
   - Mendukung foto dokumen berformat **PNG, JPG, dan WebP**.
4. **🎯 Penempatan Interaktif:**
   - Geser (drag-and-drop) tanda tangan ke posisi manapun di atas dokumen.
   - Perbesar dan perkecil ukuran tanda tangan secara presisi menggunakan *handle point*.
   - Tambahkan lebih dari satu tanda tangan (misalnya tanda tangan pihak pertama dan pihak kedua) dalam satu halaman atau halaman berbeda.
5. **✨ Tampilan UI Premium & Modern:**
   - Desain *Glassmorphism* dengan mode Gelap (Dark Mode) dan Terang (Light Mode).
   - Tampilan responsif dan mudah dipahami oleh semua kalangan.
6. **💻 Mode Desktop Aplikasi Windows:**
   - Dilengkapi dengan *launcher script* agar dapat dijalankan dalam mode jendela desktop terpisah (tanpa address bar atau tab browser), terasa seperti aplikasi native Windows pada umumnya.

---

## 🚀 Cara Menjalankan Aplikasi di Windows

Terdapat **2 cara mudah** untuk menjalankan aplikasi ini:

### Cara 1: Menggunakan Launcher Desktop (Disarankan)
1. Buka folder aplikasi ini (`e:\Iseng\TTD`).
2. Klik ganda pada file **`Jalankan_SignaDoc.bat`**.
3. Aplikasi akan otomatis terbuka dalam jendela desktop profesional tanpa tampilan tab browser (menggunakan mesin Microsoft Edge / Chrome).

### Cara 2: Membuka Langsung Melalui Browser
1. Buka folder aplikasi ini (`e:\Iseng\TTD`).
2. Klik ganda pada file **`index.html`** atau klik kanan -> *Open with* -> pilih Google Chrome, Microsoft Edge, atau Firefox.

---

## 📖 Panduan Penggunaan Singkat

1. **Unggah Dokumen:** Klik area *drop zone* di panel sebelah kiri atau tarik langsung file PDF/Gambar Anda ke dalam jendela aplikasi.
2. **Buat Tanda Tangan:** Klik tombol **"Buat Tanda Tangan Baru"**, pilih metode yang diinginkan (Gambar, Ketik, atau Unggah), lalu klik **"Gunakan Tanda Tangan"**.
3. **Tempelkan ke Dokumen:** Tanda tangan Anda akan muncul di daftar *Tanda Tangan Aktif*. Klik pada kartu tanda tangan tersebut untuk menempelkannya ke atas dokumen.
4. **Atur Posisi & Ukuran:**
   - Klik dan geser tanda tangan untuk mengatur posisinya.
   - Tarik lingkaran biru di sudut kanan bawah tanda tangan untuk mengubah ukurannya.
   - Klik tombol merah dengan ikon **X** di sudut kanan atas tanda tangan untuk menghapusnya jika batal.
5. **Unduh Dokumen:** Setelah selesai, klik tombol hijau **"Unduh Dokumen Resmi"** di pojok kiri bawah. File PDF hasil akhir yang telah tersertifikasi dengan tanda tangan digital Anda siap digunakan!

---

## 🛠️ Teknologi yang Digunakan
* **HTML5 Canvas:** Untuk melukis tanda tangan dan merender dokumen gambar.
* **Vanilla CSS3 & HSL Tokens:** Untuk styling berestetika tinggi, animasi interaktif, dan dukungan multi-tema.
* **PDF.js (Mozilla):** Untuk membaca dan merender dokumen PDF secara client-side.
* **PDF-Lib:** Untuk menyisipkan gambar tanda tangan ke dalam struktur data vektor PDF secara presisi saat proses ekspor.
