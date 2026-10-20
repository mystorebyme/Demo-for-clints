# 02 — UI/UX, POPUP ANIMATION, 6-IMAGE GALLERY & MOBILE STANDARDS

## 1. 1-Second Collapsing Add-to-Bag Popup (`components/Footer.tsx` & `lib/store.ts`)
- **Problem Solved**: Persistent bottom cart bars block mobile screens and annoy shoppers.
- **Exact Implementation**:
  - In `lib/store.ts`, record `lastAddedAt: Date.now()` and `lastAddedItemName` inside `addToCart()`.
  - In `components/Footer.tsx`, watch `lastAddedAt`:
    - `0ms -> 1000ms`: `popupPhase = 'visible'` (`translate-y-0 scale-100 opacity-100`)
    - `1000ms -> 1320ms`: `popupPhase = 'collapsing'` (`translate-y-14 scale-90 opacity-0 transition-all duration-300 ease-in-out`) — smoothly slides down into the main bottom navigation bar.
    - `1320ms`: `popupPhase = 'hidden'` and `dismissAddPopup()`.
  - Always include a circular **`×` Close button** on the right side of the popup so users can also dismiss it manually.

## 2. Mandatory `×` (Cross) Close & Remove Buttons on All Popups/Modals
- **Compare Floating Bar**:
  - Each compared product thumbnail has a top-right `×` badge (`onClick={() => toggleCompare(id)}`) to remove that individual item.
  - The bar has `Compare Now`, `Clear`, and a circular `×` button (`aria-label="Close Compare Bar"`).
- **Compare Modal**:
  - Header has `Clear All` and a circular `×` Close button (`w-9 h-9 rounded-full`).
  - Each product column has a top-right `× Remove` pill button over the product image.
- **Quick View / Quick Shop Modal (`ProductCard.tsx`)**:
  - Floating top-right circular `×` button (`absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-stone-950 text-white`) visible on both mobile and desktop.
- **Product Detail Modals (`/products/[id]/page.tsx`)**:
  - Full-Screen Image Zoom Lightbox, Size Chart Modal, Inquiry Modal, and Sticky Bottom Purchase Bar all include explicit `×` close buttons.

## 3. 6-Image Studio Gallery & Dynamic Size Table (`lib/catalog.ts`)
- Every product has `gallery: [img1, img2, img3, img4, img5, img6]` and `gallery_captions` for all 6 studio angles.
- Size selector pills display bust annotations for Kurtis (`XS [34]`, `S [36]`, `M [38]`, `L [40]`, `XL [42]`, `XXL [44]`, `3XL [46]`) with live size-specific price (`getProductPriceForSize(product, size)`) and exact garment measurements (`getSizeMeasurements(product, size)`).
