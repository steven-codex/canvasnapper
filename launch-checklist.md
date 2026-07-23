# 🚀 Canva Snapper - Production Launch Checklist

Dokumen ini berisi daftar hal yang wajib diperbarui dan disiapkan sebelum Canva Snapper resmi dirilis ke Chrome Web Store, terutama untuk memindahkan status pembayaran Polar dari **Sandbox** ke **Live (Production)**.

---

## 1. Migrasi Akun Polar (Sandbox ➡️ Live)
Karena saat ini sistem pembayaran masih menggunakan mode Sandbox, kamu harus memindahkannya ke mode produksi agar bisa menerima uang sungguhan:

- [ ] **Ganti API Token:**
  * Buka Dashboard Polar utama kamu (bukan versi Sandbox).
  * Pergi ke **Settings > Developers** dan buat token baru (Live Access Token).
- [ ] **Ganti Webhook Endpoint:**
  * Daftarkan URL Cloud Function webhook kamu di Dashboard Polar Live (contoh: `https://<region>-<project-id>.cloudfunctions.net/polarWebhook`).
  * Aktifkan event `order.created` dan dapatkan **Webhook Secret** baru untuk mode Live.
- [ ] **Buat Ulang Produk di Polar Live:**
  * Buat kembali 4 produk berikut di Dashboard Polar Live dan catat masing-masing ID produknya:
    1. **Starter Pack** (25 snaps - $1.99)
    2. **Creator Pack** (75 snaps - $3.99)
    3. **Pro Pack** (200 snaps - $9.99)
    4. **Pro Monthly** (Unlimited snaps - $7.99/bulan)
- [ ] **Update Environment Variables Cloud Functions:**
  * Perbarui variabel environment di Cloud Functions Firebase kamu menggunakan token rahasia Live yang baru:
    ```bash
    firebase functions:secrets:set POLAR_ACCESS_TOKEN="live_access_token_kamu"
    firebase functions:secrets:set POLAR_WEBHOOK_SECRET="live_webhook_secret_kamu"
    firebase functions:secrets:set POLAR_CREDITS_S_PRODUCT_ID="live_product_id_starter"
    firebase functions:secrets:set POLAR_CREDITS_M_PRODUCT_ID="live_product_id_creator"
    firebase functions:secrets:set POLAR_CREDITS_L_PRODUCT_ID="live_product_id_pro_pack"
    firebase functions:secrets:set POLAR_PRO_MONTHLY_PRODUCT_ID="live_product_id_pro_monthly"
    firebase functions:secrets:set POLAR_PRO_LIFETIME_PRODUCT_ID="live_product_id_lifetime"
    ```
  * Lakukan deploy ulang Cloud Functions agar perubahan secret tersebut diterapkan:
    ```bash
    firebase deploy --only functions
    ```

---

## 2. Pembuatan Halaman Kebijakan Privasi (Privacy Policy)
Google Chrome Web Store mewajibkan adanya tautan Kebijakan Privasi yang aktif karena aplikasi kamu membaca email pengguna saat login Google.

- [ ] **Deploy Privacy Policy di Firebase Hosting:**
  * Kamu bisa membuat file HTML sederhana bernama `privacy.html` di dalam folder `backend/public/`.
  * Lakukan deploy hosting:
    ```bash
    firebase deploy --only hosting
    ```
  * Tautan kamu akan aktif di: `https://canva-snapper-pro-9e1b3.web.app/privacy.html`. URL inilah yang akan kamu masukkan ke kolom registrasi Web Store.

---

## 3. Aset Listing Chrome Web Store
Sebelum menekan tombol submit untuk review, siapkan aset promosi berikut:

- [ ] **Ikon Aplikasi:** Menggunakan file `icon128.png` yang sudah kita generate di folder `public/`.
- [ ] **Screenshots Promosi:**
  * Ambil 3-4 tangkapan layar antarmuka Canva Snapper (Popup, Galeri riwayat, dan checkout page).
  * Ukuran wajib **1280x800** atau **640x400** piksel.
- [ ] **Draf Deskripsi:** Gunakan draf deskripsi produk & cara penggunaan yang sudah kita buat sebelumnya di chat.

---

## 4. Langkah Build Akhir
Sebelum men-zip file untuk diunggah ke Google:

- [ ] Jalankan perintah kompilasi final untuk memastikan semua baris kode ter-build sempurna:
  ```bash
  npm run build
  ```
- [ ] Buka folder proyekmu, temukan folder **`dist/`** yang dihasilkan dari proses build.
- [ ] Kompres seluruh isi di dalam folder **`dist/`** (pastikan file `manifest.json` berada di root file zip) menjadi satu file zip bernama `canva-snapper.zip`.
- [ ] Unggah file zip tersebut ke Chrome Developer Console.
