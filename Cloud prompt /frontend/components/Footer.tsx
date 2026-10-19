'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatINR, useStore } from '../lib/store';

export default function Footer() {
  const { t, lang, totalCount, totalPaise, wishlist } = useStore();
  const pathname = usePathname();
  const count = totalCount();
  const total = totalPaise();

  const hideMobileNav = pathname?.startsWith('/admin');

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

      {/* Floating Bag Checkout Strip when cart has items (on Home/Collection/Wishlist pages) */}
      {!hideMobileNav &&
        count > 0 &&
        pathname !== '/cart' &&
        pathname !== '/checkout' &&
        !pathname?.startsWith('/order/') && (
          <div className="fixed bottom-16 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none no-print">
            <div className="max-w-lg mx-auto pointer-events-auto">
              <Link
                href="/cart"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-stone-950/95 text-white border border-amber-500/40 shadow-2xl backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-stone-950 text-xs font-extrabold">
                    {count}
                  </span>
                  <div>
                    <span className="block text-xs font-bold tracking-wide text-amber-300">
                      {formatINR(total)}
                    </span>
                    <span className="block text-[10px] text-stone-300">
                      {lang === 'hi' ? 'बैग और तेज़ UPI चेकआउट देखें' : 'View Bag & Instant UPI Checkout'}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 text-[11px] font-extrabold uppercase tracking-wider">
                  {t('bag')}
                </span>
              </Link>
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
