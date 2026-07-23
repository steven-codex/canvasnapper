# Canva Design System — Referensi

Diekstrak dari dokumentasi resmi Canva Apps SDK (canva.dev) + riset brand color pihak ketiga. Ini cocok dipakai sebagai referensi visual (bukan source code langsung), karena token asli Canva cuma bisa dipakai di dalam Canva Apps SDK mereka.

---

## 1. Brand Colors

Canva gak publish brand spec sheet resmi ke publik, tapi ini hex yang paling konsisten dipakai di web & marketing mereka:

| Nama | Hex | Kegunaan |
|---|---|---|
| Canva Purple | `#7D2AE7` (varian: `#8B3DFF`) | Primary brand, CTA utama |
| Canva Blue | `#3969E7` | Secondary/gradient partner |
| Canva Teal/Cyan | `#00C4CC` (varian: `#07B9CE`) | Accent, gradient partner |
| Dark/Ink | `#0D1216` (umum dipakai) | Teks utama di light mode |

> Catatan: warna-warna ini sering dipakai dalam **gradient** (purple → blue → teal) di marketing page mereka, bukan solid flat color aja.

---

## 2. Functional Color Tokens (App UI Kit)

Canva pakai pendekatan **"functional naming"** — nama token berdasarkan peran, bukan warna literal (misal `colorActionPrimaryBg`, bukan `purple500`). Ini best practice yang enak buat ditiru di Newseed POS juga, biar gampang ganti tema.

| Kategori | Contoh token | Dipakai untuk |
|---|---|---|
| **Action - Primary** | `colorActionPrimaryBg`, `colorActionPrimaryFg` | Tombol CTA utama |
| **Action - Secondary** | `colorActionSecondaryBg`, `colorActionSecondaryBorder` | Tombol sekunder |
| **Action - Tertiary** | `colorActionTertiaryBg` | Menu item, tombol subtle |
| **Feedback - Positive** | `colorFeedbackPositiveBg/Fg` | Sukses |
| **Feedback - Warn** | `colorFeedbackWarnBg/Fg` | Peringatan |
| **Feedback - Critical** | `colorFeedbackCriticalBg/Fg` | Error |
| **Feedback - Info** | `colorFeedbackInfoBg/Fg` | Info netral |
| **UI Neutral** | `colorUiNeutralBg`, `colorUiBorder` | Background & border netral |
| **Content** | `colorContentFg`, `colorContentSubtleFg`, `colorContentSubtlestFg` | Hierarki teks (3 level: strong → subtle → subtlest) |
| **Control** | `colorControlBg`, `colorControlBorder`, `colorControlBorderFocused` | Input, select, slider |
| **Link** | `colorLinkFg`, `colorLinkFgHovered` | Link |
| **Surface/Elevation** | `elevationSurfaceBg`, `elevationSurfaceRaisedBg`, `elevationSurfaceFloatingBg` | Layer/z-index visual (card, modal, dropdown) |

Setiap token punya versi **dark** & **light theme** otomatis — semua komponen auto-adapt tanpa perlu override manual.

---

## 3. Typography

Font utama: **Canva Sans** & **Canva Sans Display** (custom typeface, gak tersedia gratis untuk dipakai di luar Canva — kalau mau look serupa, alternatif open-source yang mirip: **Inter**, **Plus Jakarta Sans**, atau **General Sans**).

### Titles (heading)
| Nama | Ukuran | Font |
|---|---|---|
| Title large | 24px | Canva Sans Display (bold) |
| Title medium | 20px | Canva Sans Display |
| Title small | 16px | Canva Sans |
| Title xsmall | 14px | Canva Sans |

### Body text
| Nama | Ukuran |
|---|---|
| Text large | 16px |
| Text medium | 14px |
| Text small | 12px |
| Text xsmall | 10px |

**Weight yang dipakai:** regular, medium, bold (cuma 3 — gak pakai light/black, jaga konsistensi).

**Aturan penting:**
- Jangan underline buat emphasis (kecuali link) → pakai bold/ukuran lebih besar.
- Title & Text ukuran senada dipasangkan (misal Title medium 20px pairing sama Text medium 14px).

---

## 4. Spacing Scale

Base unit = **8px**. Semua spacing kelipatan dari ini (mirip 8-point grid system yang umum di banyak design system modern).

| Token | Units | Pixel |
|---|---|---|
| `space0` | 0 | 0px |
| `space050` | 0.5u | 4px |
| `space100` | 1u | 8px |
| `space150` | 1.5u | 12px |
| `space200` | 2u | 16px |
| `space300` | 3u | 24px |
| `space400` | 4u | 32px |
| `space600` | 6u | 48px |
| `space800` | 8u | 64px |
| `space1200` | 12u | 96px |

### Border radius
| Token | Pixel |
|---|---|
| `radiusElementSharp` | 4px |
| `radiusElement` | 8px |

### Touch target
| Token | Pixel |
|---|---|
| `minTouchableArea` | 44px (standard accessibility minimum) |

---

## 5. Ringkasan Prinsip Desain

1. **Functional naming over literal color** — nama token berbasis peran (`primary`, `critical`, `subtle`) biar gampang re-theme.
2. **8pt spacing grid** — semua jarak kelipatan 8px (dengan step 4px untuk yang paling kecil).
3. **3-level text hierarchy** — `Fg` → `SubtleFg` → `SubtlestFg` untuk teks primer, sekunder, tersier.
4. **Elevation via background, bukan cuma shadow** — `surfaceBg` → `raisedBg` → `floatingBg` buat layering visual.
5. **Dark mode-first** — token otomatis switch warna berdasarkan tema, bukan hardcode.

---

## Sumber
- [canva.dev — App UI Kit Design Tokens](https://www.canva.dev/docs/apps/app-ui-kit/design-tokens/)
- [canva.dev — Design Guidelines: Colors](https://www.canva.dev/docs/apps/design-guidelines/colors/)
- [canva.dev — Design Guidelines: Typography](https://www.canva.dev/docs/apps/design-guidelines/typography/)
- [canva.dev — Spacing Tokens](https://www.canva.dev/docs/apps/app-ui-kit/spacing/)
- Figma library resmi (App UI Kit Resource): https://www.figma.com/file/zuskoLLiuDy33IWuUwBtEu/App-UI-Kit-Resource
- Hex brand color: agregasi dari Mobbin & pickcoloronline (bukan spec resmi publik Canva)
