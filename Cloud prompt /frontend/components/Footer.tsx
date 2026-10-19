'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEMO_PRODUCTS, getProductPriceForSize } from '../lib/catalog';
import { formatEthnicSizeLabel, extractProductShade } from './ProductCard';
import { formatINR, rupees, useStore } from '../lib/store';

export default function Footer() {
  const {
    t,
    lang,
    totalCount,
    totalPaise,
    wishlist,
    compareList,
    toggleCompare,
    clearCompare,
    addToCart,
    lastAddedAt,
    lastAddedItemName,
    dismissAddPopup,
  } = useStore();
  const pathname = usePathname();
  const count = totalCount();
  const total = totalPaise();

  const hideMobileNav = pathname?.startsWith('/admin');

  // Show Add-to-Bag popup ONLY for 1 second after an item is added, then animate down into bottom bar and hide
  const [popupPhase, setPopupPhase] = useState<'hidden' | 'visible' | 'collapsing'>('hidden');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareBarMinimized, setCompareBarMinimized] = useState(false);

  useEffect(() => {
    if (!lastAddedAt || count <= 0) {
      setPopupPhase('hidden');
      return;
    }
    setPopupPhase('visible');
    const collapseTimer = setTimeout(() => {
      setPopupPhase('collapsing');
    }, 1000);
    const hideTimer = setTimeout(() => {
      setPopupPhase('hidden');
      dismissAddPopup();
    }, 1320);

    return () => {
      clearTimeout(collapseTimer);
      clearTimeout(hideTimer);
    };
  }, [lastAddedAt, count, dismissAddPopup]);

  // Whenever compareList increases, un-minimize the compare bar
  useEffect(() => {
    if (compareList.length > 0) {
      setCompareBarMinimized(false);
    } else {
      setShowCompareModal(false);
    }
  }, [compareList.length]);

  const handleClosePopup = () => {
    setPopupPhase('collapsing');
    setTimeout(() => {
      setPopupPhase('hidden');
      dismissAddPopup();
    }, 250);
  };

  return (
    <>
      <footer className="bg-stone-950 text-stone-300 border-t border-amber-500/20 mt-16 pb-24 md:pb-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-stone-800">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-serif font-bold text-lg">
                  Z
                </div>
                <div>
                  <span className="block font-serif text-xl font-bold tracking-[0.18em] text-white">
                    ZARIYA JAIPUR
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.24em] text-amber-400">
                    Handcrafted Royal Couture
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed">
                {lang === 'hi'
                  ? 'जयपुर के पारंपरिक कारीगरों द्वारा निर्मित हैंड-ब्लॉक कुर्तियाँ, ज़रदोज़ी पोटली बैग्स और कुंदन-मीनाकारी ज्वेलरी। हर ऑर्डर के साथ आधिकारिक GST टैक्स इनवॉइस और गोपनीय ट्रैकिंग आईडी।'
                  : 'Authentic Jaipur hand-block kurtis, zardozi potli clutches, and kundan-meenakari jewellery crafted by master artisans. Every order includes an official CGST Rule 46(b) Tax Invoice and 12-digit courier tracking.'}
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-amber-200/90">
                <span className="px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800">
                  GSTIN: 08AABCK7412R1Z5
                </span>
                <span className="px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800">
                  State Code: 08 (Rajasthan)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800">
                  256-Bit Encrypted UPI Checkout
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <h3 className="text-amber-300 font-bold uppercase tracking-[0.18em] text-[11px]">
                {lang === 'hi' ? 'ग्राहक सेवाएं' : 'Client Concierge'}
              </h3>
              <ul className="space-y-2 text-stone-400">
                <li>
                  <Link href="/" className="hover:text-white transition">
                    {t('homeLabel')}
                  </Link>
                </li>
                <li>
                  <Link href="/#collection" className="hover:text-white transition">
                    {t('collectionLabel')}
                  </Link>
                </li>
                <li>
                  <Link href="/wishlist" className="hover:text-white transition">
                    {t('wishlist')} ({wishlist.length})
                  </Link>
                </li>
                <li>
                  <Link href="/track" className="hover:text-white transition">
                    {t('trackOrder')}
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-white transition">
                    {t('bag')} ({count})
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5 text-xs">
              <h3 className="text-amber-300 font-bold uppercase tracking-[0.18em] text-[11px]">
                {lang === 'hi' ? 'जयपुर फ्लैगशिप बुटीक' : 'Jaipur Flagship Atelier'}
              </h3>
              <p className="text-stone-400 leading-relaxed">
                Showroom 14, Heritage Arcade, MI Road, Jaipur, Rajasthan – 302001
              </p>
              <p className="text-stone-400">concierge@zariyajaipur.in</p>
              <p className="text-stone-400">+91-9876543210 (10 AM – 8 PM IST)</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
            <p>© 2026 Zariya Heritage Craft Pvt. Ltd. All rights reserved.</p>
            <p>{t('footerSafety')}</p>
          </div>
        </div>
      </footer>

      {/* Global Product Compare Bar & Side-by-Side Compare Modal (with individual × remove & × close buttons) */}
      {!hideMobileNav && compareList.length > 0 && !compareBarMinimized && (
        <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-stone-950 text-white rounded-2xl border border-amber-400/50 shadow-2xl px-4 py-3 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-extrabold shrink-0">
              Compare ({compareList.length}/4)
            </span>
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              {compareList.map((cid) => {
                const cp = DEMO_PRODUCTS.find((x) => x.id === cid);
                if (!cp) return null;
                return (
                  <div key={`cmp-thumb-${cid}`} className="relative shrink-0">
                    <img
                      src={cp.image_url}
                      alt={cp.name}
                      className="w-9 h-10 rounded-lg object-cover border border-stone-700"
                    />
                    <button
                      type="button"
                      onClick={() => toggleCompare(cid)}
                      aria-label={`Remove ${cp.name} from compare`}
                      title="Remove from Compare"
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-extrabold uppercase tracking-wider"
            >
              Compare Now
            </button>
            <button
              type="button"
              onClick={clearCompare}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-700 text-xs font-semibold text-stone-200 hover:text-white transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                clearCompare();
                setCompareBarMinimized(true);
              }}
              aria-label="Close Compare Bar"
              title="Close Compare"
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-rose-700 text-white flex items-center justify-center text-sm font-bold transition"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showCompareModal && compareList.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-print"
          onClick={() => setShowCompareModal(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-stone-200 overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-rose-900">
                  SIDE-BY-SIDE COMPARISON
                </p>
                <h3 className="text-lg sm:text-2xl font-serif font-bold text-stone-900">
                  Compare Selected Creations ({compareList.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCompare();
                    setShowCompareModal(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-800 text-xs font-bold transition"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompareModal(false)}
                  aria-label="Close Compare Modal"
                  title="Close"
                  className="w-9 h-9 rounded-full bg-stone-900 hover:bg-rose-900 text-white text-lg font-bold flex items-center justify-center shadow transition"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {compareList.map((cid) => {
                const cp = DEMO_PRODUCTS.find((x) => x.id === cid);
                if (!cp) return null;
                const defaultSz = cp.sizes?.includes('M') ? 'M' : cp.sizes?.[0] || 'Free Size';
                const quote = getProductPriceForSize(cp, defaultSz);
                const shade = extractProductShade(cp.name);
                return (
                  <div
                    key={`cmp-col-${cp.id}`}
                    className="rounded-2xl border border-stone-200 p-3.5 flex flex-col justify-between bg-stone-50/70 space-y-3"
                  >
                    <div>
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white border border-stone-200 mb-3">
                        <img src={cp.image_url} alt={cp.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => toggleCompare(cp.id)}
                          aria-label={`Remove ${cp.name}`}
                          className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-stone-950/85 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 shadow transition"
                        >
                          <span>×</span>
                          <span>Remove</span>
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-stone-500">{cp.sku}</p>
                      <Link
                        href={`/products/${cp.id}`}
                        onClick={() => setShowCompareModal(false)}
                        className="font-serif font-bold text-sm text-stone-900 hover:text-rose-900 line-clamp-2 mt-0.5"
                      >
                        {lang === 'hi' && cp.name_hi ? cp.name_hi : cp.name}
                      </Link>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-base font-extrabold text-rose-900">
                          {rupees(quote.price_paise)}
                        </span>
                        {quote.original_price_paise && (
                          <span className="text-xs text-stone-400 line-through">
                            {rupees(quote.original_price_paise)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 space-y-1 text-[11px] text-stone-600 border-t border-stone-200 pt-2">
                        <p>
                          <strong>Shade:</strong> {shade.label}
                        </p>
                        <p>
                          <strong>Rating:</strong> {cp.rating.toFixed(1)} / 5 ({cp.reviews_count})
                        </p>
                        <p>
                          <strong>Sizes:</strong>{' '}
                          {cp.sizes.map((s) => formatEthnicSizeLabel(s, cp.category)).join(', ')}
                        </p>
                        <p>
                          <strong>Stock:</strong>{' '}
                          {cp.stock > 0 ? `${cp.stock} In Stock` : 'Pre-Order Only'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={cp.stock <= 0}
                      onClick={() =>
                        addToCart({
                          id: cp.id,
                          name: cp.name,
                          name_hi: cp.name_hi,
                          price_paise: quote.price_paise,
                          qty: 1,
                          size: quote.size,
                          image_url: cp.image_url,
                          category: cp.category,
                        })
                      }
                      className="w-full py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs font-extrabold disabled:opacity-40"
                    >
                      + {t('addToCart')} ({formatEthnicSizeLabel(defaultSz, cp.category)})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 1-Second Animated Add-to-Bag Popup: Appears on Add to Bag, animates down into the bottom bar after 1s, and includes a Close (×) button */}
      {!hideMobileNav &&
        popupPhase !== 'hidden' &&
        count > 0 &&
        pathname !== '/cart' &&
        pathname !== '/checkout' &&
        !pathname?.startsWith('/order/') && (
          <div
            className={`fixed bottom-16 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none no-print transition-all duration-300 ease-in-out ${
              popupPhase === 'visible'
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-14 scale-90 opacity-0'
            }`}
          >
            <div className="max-w-lg mx-auto pointer-events-auto flex items-center justify-between gap-2.5 px-4 py-3 rounded-2xl bg-stone-950/95 text-white border border-amber-500/40 shadow-2xl backdrop-blur-md">
              <Link href="/cart" className="flex items-center gap-3 min-w-0 flex-1">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-stone-950 text-xs font-extrabold shrink-0">
                  {count}
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-bold tracking-wide text-amber-300 truncate">
                    {lastAddedItemName
                      ? lang === 'hi'
                        ? `बैग में जोड़ा गया: ${lastAddedItemName}`
                        : `Added to Bag: ${lastAddedItemName}`
                      : formatINR(total)}
                  </span>
                  <span className="block text-[10px] text-stone-300 truncate">
                    {formatINR(total)} ·{' '}
                    {lang === 'hi' ? 'बैग और चेकआउट देखें' : 'Tap to View Bag & Checkout'}
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/cart"
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-extrabold uppercase tracking-wider"
                >
                  {t('bag')}
                </Link>
                <button
                  type="button"
                  onClick={handleClosePopup}
                  aria-label="Close Add to Bag Popup"
                  title="Close"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 text-stone-200 hover:text-white flex items-center justify-center text-sm font-bold transition"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Fixed Bottom Screen Bar — Strictly Home, Collection, Favourites (Zero Emojis) */}
      {!hideMobileNav && (
        <nav
          aria-label="Bottom Navigation"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] no-print"
        >
          <div className="max-w-xl mx-auto grid grid-cols-3 h-15">
            {/* 1. Home */}
            <Link
              href="/"
              className={`flex flex-col items-center justify-center gap-1 py-2 transition ${
                pathname === '/' ? 'text-stone-950 font-bold' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={pathname === '/' ? 2.2 : 1.7}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.14em]">{t('homeLabel')}</span>
            </Link>

            {/* 2. Collection */}
            <Link
              href="/#collection"
              className={`flex flex-col items-center justify-center gap-1 py-2 transition ${
                pathname?.startsWith('/products')
                  ? 'text-stone-950 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.14em]">{t('collectionLabel')}</span>
            </Link>

            {/* 3. Favourites */}
            <Link
              href="/wishlist"
              className={`relative flex flex-col items-center justify-center gap-1 py-2 transition ${
                pathname === '/wishlist'
                  ? 'text-stone-950 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <div className="relative">
                <svg
                  className="w-5 h-5"
                  fill={pathname === '/wishlist' ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-stone-950 text-[9px] font-extrabold flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-[0.14em]">{t('wishlist')}</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
