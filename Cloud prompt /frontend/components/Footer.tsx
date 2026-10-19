'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '../lib/store';

export default function Footer() {
  const pathname = usePathname();
  const { lang, cart, wishlist, t } = useStore();
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const wishlistCount = wishlist.length;
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 mt-12 pb-20 md:pb-0 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-800 to-amber-600 flex items-center justify-center text-amber-100 font-serif font-bold text-sm border border-amber-400/40">
                ZJ
              </div>
              <span className="text-lg font-serif font-bold text-white">{t('brand')}</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">{t('footerAbout')}</p>
            <p className="text-xs text-stone-500 mt-3 font-mono">
              GSTIN: 08AABCZ9481K1Z4 • Johari Bazar, Jaipur – 302002
            </p>
          </div>

          <div>
            <h3 className="text-xs font-extrabold text-amber-300 uppercase tracking-widest mb-3">
              {t('footerQuickLinks')}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-amber-300 transition-colors">
                  {t('allCategories')}
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-amber-300 transition-colors">
                  ♥ {t('wishlistTitle')}
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="hover:text-amber-300 transition-colors font-semibold text-amber-200"
                >
                  📦 {t('trackOrderNav')}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-amber-300 transition-colors">
                  🛍️ {t('cart')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-extrabold text-amber-300 uppercase tracking-widest mb-3">
              {t('footerSupport')}
            </h3>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>✨ 100% Authentic GI-Certified Jaipur Handloom</li>
              <li>🧾 Official GST Tax Invoice with Every Order</li>
              <li>📧 Instant Order Receipt & Tracking ID on Email</li>
              <li>💬 Boutique Concierge: +91-98765-43210 (10 AM – 8 PM)</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-900 py-4 px-4 text-xs text-stone-500">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <span>
              © {new Date().getFullYear()} {t('brand')} • Zariya Heritage Apparels Pvt. Ltd., Jaipur
            </span>
            <span className="text-[11px] text-stone-500">
              100% Secure UPI • Insured Pan-India Express Delivery
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile-First Sticky App Bottom Navigation Bar (Visible on 90% Mobile Devices) */}
      {!isAdminRoute && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] print:hidden"
        >
          <div className="grid grid-cols-5 h-16">
            <Link
              href="/"
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
                pathname === '/' ? 'text-rose-900' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <span className="text-base leading-none">🏠</span>
              <span>{lang === 'hi' ? 'होम' : 'Home'}</span>
            </Link>

            <a
              href="/#catalog"
              className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-stone-500 hover:text-rose-900 transition-colors"
            >
              <span className="text-base leading-none">👗</span>
              <span>{lang === 'hi' ? 'कलेक्शन' : 'Shop'}</span>
            </a>

            <Link
              href="/wishlist"
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
                pathname?.startsWith('/wishlist')
                  ? 'text-rose-900'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <span className="text-base leading-none">♥</span>
              <span>{lang === 'hi' ? 'पसंदीदा' : 'Wishlist'}</span>
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-4 min-w-[16px] h-4 px-1 rounded-full bg-rose-700 text-white text-[9px] font-extrabold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/track"
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
                pathname?.startsWith('/track')
                  ? 'text-rose-900'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <span className="text-base leading-none">📦</span>
              <span>{lang === 'hi' ? 'ट्रैक' : 'Track'}</span>
            </Link>

            <Link
              href="/cart"
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
                pathname?.startsWith('/cart') || pathname?.startsWith('/checkout')
                  ? 'text-rose-900'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <span className="text-base leading-none">🛍️</span>
              <span>{lang === 'hi' ? 'बैग' : 'Bag'}</span>
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-4 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-stone-950 text-[9px] font-extrabold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
