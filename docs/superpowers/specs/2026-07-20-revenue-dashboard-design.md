# Design Specification: Interactive Revenue Dashboard & Metrics Card
* **Date:** 2026-07-20
* **Project:** Canva Snapper (Pro Edition)
* **Author:** Anti-gravity (AI Assistant)
* **Status:** Draft / Awaiting Review

---

## 1. Executive Summary
This design specification covers the implementation of a new interactive Revenue Analytics dashboard and a sidebar Monthly Recurring Revenue (MRR) metric card within the Canva Snapper Owner Console (`admin.html` / `src/admin/Admin.tsx`). 

The goal is to provide a premium, visually stunning representation of the extension's business performance (recurring revenue, one-time sales, product mix distribution, and growth charts) that matches the high design standards of premium developer tools (Figma, Linear).

---

## 2. Design System & Aesthetics
Following the **Impeccable** and **Emil Kowalski Design Engineering** guidelines:
* **Typography:** `Plus Jakarta Sans` for body text and headers; tabular-nums/monospace alignment (`font-mono`) for numerical values to ensure structured alignment.
* **Colors (OKLCH-based equivalents in Tailwind):**
  * Canvas Accent: `#7d2ae7` (Violet)
  * Ink Text: `#0d1216` (Deep Navy)
  * Secondary Border: `#e8ecef`
  * Visual Chart Gradient: Gradients fading from `#7d2ae7` (Canva Purple) to `#00c4cc` (Canva Teal).
* **Banned Patterns:** 
  * NO giant drop shadows paired with borders (`border: 1px solid` + `box-shadow` blur $\geq 16px$).
  * NO text gradients.
  * NO over-rounded corners (cards max out at `12px` / `rounded-xl`).
  * NO dialog scaling from `scale(0)` (instead, scale down/up from `scale(0.95)` with opacity).

---

## 3. Architecture & Functional Details

### 3.1. Sidebar MRR Card
* **Position:** Placed underneath the "Pro Subscriptions" card.
* **Calculation:** 
  $$\text{MRR} = N_{\text{pro}} \times 7.99$$
  where $N_{\text{pro}}$ is the count of users in Firestore with `tier === 'pro'`.
* **Interactions:** A rolling counter animation that counts up from `$0` to the actual MRR on mount over 1.2s using a cubic-bezier easing curve (`cubic-bezier(0.23, 1, 0.32, 1)`).

### 3.2. Financial Analytics Tab
A new tab labeled **"Financials"** added to the main section next to "Registered Users" and "Guest Devices". When active, it displays:

1. **KPI Metric Row (4 columns):**
   * **MRR:** Dynamic calculation of recurring subscription value.
   * **Credit Pack Revenue:** Estimated total from Credit Packs (Starter Pack: \$3.99, Creator Pack: \$4.99). Calculated based on users who have active credits beyond the baseline welcome credits (e.g. `credits - 10`).
   * **Gross Estimated Revenue:** Sum of MRR + Credit Pack Sales.
   * **ARPU:** Gross Revenue divided by Total Users.

2. **Interactive SVG Line Chart:**
   * A custom React-rendered SVG line chart displaying daily/weekly revenue trends.
   * Responsive viewport sizing.
   * Hover-state crosshairs and a tooltip that tracks the pointer. The tooltip features a spring-like delay (180ms ease-out) to feel organic and fluid.

3. **Product Sales Distribution Chart:**
   * Visual progress-bars or SVG circles representing the breakdown of sales between the different offerings: Starter Pack (\$3.99), Creator Pack (\$4.99), Pro Monthly (\$7.99), and Pro Lifetime (\$7.00).

---

## 4. Verification & Testing Plan
* **Manual Verification:** 
  * Open the console in the Chrome browser, select the "Financials" tab, and verify that the layout scales properly on mobile and desktop screens.
  * Verify the rolling counter triggers successfully on load.
  * Hover over chart data points to confirm the tooltip renders exactly at the pointer position with smooth acceleration/deceleration.
