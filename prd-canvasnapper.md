# Product Requirement Document (PRD)

## Project: Canva Snapper (Pro Edition)
**Version:** 1.0.0  
**Target Architecture:** Google Chrome Extension (Manifest V3)  
**Author / Product Owner:** Steven Sondra Allen Widodo  

---

## 1. Product Overview & Value Proposition
**Canva Snapper** adalah sebuah Chrome Extension premium yang berfungsi sebagai *shortcut tool* berkinerja tinggi bagi para profesional UI/UX Designer dan Product Visualization Specialist. Extension ini memotong jalur *workflow* desain yang repetitif untuk memindahkan aset visual langsung dari Canva Editor ke platform desain/komunikasi eksternal (Figma, WhatsApp, Gemini, Discord, dll) tanpa harus melalui proses manual `Download -> Save File -> Open File Explorer -> Drag & Drop`.

Dengan memanfaatkan integrasi **Canvas API** dan optimalisasi penanganan data gambar publik (`/tl.png`), extension ini mengekstraksi dan menyalin aset visual dalam bentuk file mentah `image/png` transparan secara instan ke *system clipboard* dengan resolusi render penuh yang optimal.

---

## 2. User Personas & Core Pain Points
* **Persona:** UI/UX Designer, Product Visualization Specialist, Content Creator.
* **Core Pain Points:**
  * **Inisiasi Waktu yang Lambat:** Proses ekspor aset satuan di Canva memakan banyak klik dan waktu tunggu *rendering server*.
  * **Folder Downloads yang Berantakan:** Mengunduh puluhan aset sementara untuk sekali pakai mengotori penyimpanan lokal.
  * **Kehilangan Alpha Channel (Transparansi):** Metode alternatif menggunakan *system screenshot* (Snipping Tool / Lightshot) merusak resolusi dan membuang transparansi latar belakang (alpha channel), serta memunculkan *bounding box border* yang mengganggu.

---

## 3. Core Feature Specifications (MVP Scope)

### 3.1. Smart DOM & CDN Pattern Detection
* **Deskripsi:** Sistem harus mampu mengenali elemen gambar asli milik Canva (`media-public.canva.com`) secara akurat meskipun Canva menerapkan *dynamic CSS class names obfuscation* (seperti `div.Izwocg` atau `img._7_i_XA`) yang berubah secara berkala.
* **Kriteria Penerimaan (Acceptance Criteria):**
  * Deteksi mengandalkan pendekatan *CSS Attribute Selector* yang menargetkan tag `img` yang memuat substring pola URL CDN Canva.
  * Mampu dipicu melalui *Event Listener* Klik Kanan (`contextmenu`) tepat di atas elemen yang aktif di area editor.

### 3.2. Canvas API Offscreen Extraction & Upscaling
* **Deskripsi:** Mengambil data gambar pratinjau publik (`/tl.png`) yang bebas dari proteksi AWS S3 `AccessDenied`, lalu menggambarnya ulang di dalam memori menggunakan *offscreen canvas* tersembunyi.
* **Kriteria Penerimaan (Acceptance Criteria):**
  * Ukuran dimensi canvas harus dikunci pada resolusi *natural width* dan *natural height* gambar asli (bukan ukuran display CSS) untuk mendapatkan ketajaman piksel tertinggi yang tersedia di DOM.
  * Output diekspor ke dalam format data `Blob` tipe `image/png`.

### 3.3. CORS & Tainted Canvas Security Bypass
* **Deskripsi:** Mengantisipasi isu keamanan browser (`SecurityError: The operation is insecure`) akibat memproses gambar lintas-domain dari CDN Canva ke *clipboard script*.
* **Kriteria Penerimaan (Acceptance Criteria):**
  * Setiap instansiasi objek gambar wajib menyertakan atribut `img.crossOrigin = "anonymous"`.
  * Jika diperlukan, *Background Service Worker* akan bertindak sebagai proksi pengunduhan data biner gambar untuk menghindari penolakan kebijakan CORS.

### 3.4. Premium UI Popup & History Tracking Log
* **Deskripsi:** Antarmuka *Popup* extension minimalis dengan tema gelap/terang modern yang konsisten dengan estetika alat desain profesional (Linear, Figma).
* **Kriteria Penerimaan (Acceptance Criteria):**
  * Memiliki status indikator aktivitas ekstensi yang interaktif.
  * Memuat fitur *History Log* untuk menyimpan daftar 5 aset terakhir yang berhasil disalin agar pengguna bisa menyalin kembali tanpa membuka tab editor Canva.

---

## 4. Technical Stack & Architecture

* **Bundler & Build Tool:** Vite + TypeScript (Menghasilkan kode produksi yang ringkas dan cepat).
* **Framework Ekstensi:** `@crxjs/vite-plugin` (Standardisasi integrasi Manifest V3 dengan kapabilitas *Hot Module Replacement* / HMR).
* **UI & Styling Component:** Tailwind CSS + Radix Primitives / Lucide React Icons.
* **Core API Browser:** Chrome Extension Core API (`activeTab`, `clipboardWrite`, `contextMenus`), HTML5 Canvas API, Clipboard API (`Navigator.clipboard.write`).