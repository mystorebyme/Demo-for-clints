'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '../lib/store';

export default function Header() {
  const pathname = usePathname();
  const { lang, toggleLang, cart, wishlist, appliedCoupon, setAppliedCoupon, hydrate, t } =
    useStore();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const wishlistCount = wishlist.length;
  const isAdminRoute = pathname?.startsWith('/admin');

  const handleApplyTopCoupon = (code: string) => {
    setAppliedCoupon(code);
    setCopiedCode(code);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-amber-100 shadow-sm print:hidden">
      {/* Top Luxury Privilege & Coupon Bar */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-900 text-amber-50 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium tracking-wide flex items-center gap-1.5">
            <span>✨ {t('freeShippingBanner')}</span>
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleApplyTopCoupon('DIWALI20')}
              className="px-2.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-100 font-semibold transition"
              title="Click to apply 20% OFF privilege code"
            >
              🎟️{' '}
              {copiedCode === 'DIWALI20' || appliedCoupon === 'DIWALI20'
                ? '✓ DIWALI20 Applied'
                : 'Code: DIWALI20 (20% OFF)'}
            </button>
            <button
              type="button"
              onClick={() => handleApplyTopCoupon('FIRST10')}
              className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition"
              title="Click to apply 10% OFF privilege code"
            >
              {copiedCode === 'FIRST10' || appliedCoupon === 'FIRST10'
                ? '✓ FIRST10 Applied'
                : 'FIRST10 (10% OFF)'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Boutique Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-900 to-amber-700 flex items-center justify-center text-amber-100 font-serif font-bold text-lg shadow-sm border border-amber-300/40 group-hover:scale-105 transition-transform">
            ZJ
          </div>
          <div>
            <span className="block text-base sm:text-lg font-extrabold text-stone-900 tracking-tight leading-none">
              {t('brand')}
            </span>
            <span className="hidden sm:block text-xs text-stone-500 mt-0.5">
              {t('brandTagline')}
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2.5">
          <Link
            href="/"
            className={`text-sm font-medium px-2.5 py-1.5 rounded-lg transition-colors hidden md:inline-block ${
              pathname === '/'
                ? 'bg-rose-50 text-rose-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            {lang === 'hi' ? 'कलेक्शन' : 'Collection'}
          </Link>

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className={`relative inline-flex items-center gap-1 text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              pathname?.startsWith('/wishlist')
                ? 'bg-rose-50 text-rose-900 font-semibold border border-rose-200'
                : 'text-stone-600 hover:text-rose-800 hover:bg-rose-50/60'
            }`}
          >
            <span className="text-rose-700 text-sm">♥</span>
            <span className="hidden sm:inline">{lang === 'hi' ? 'पसंदीदा' : 'Wishlist'}</span>
            {wishlistCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-900 rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/track"
            className={`text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
              pathname?.startsWith('/track')
                ? 'bg-amber-100 text-amber-950 font-semibold border border-amber-300'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            📦 {t('trackOrderNav')}
          </Link>

          {isAdminRoute && (
            <Link
              href="/"
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-stone-900 text-white"
            >
              ← Storefront
            </Link>
          )}

          <button
            type="button"
            onClick={toggleLang}
            aria-label="Switch Language"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 text-xs sm:text-sm font-semibold text-stone-800 transition-colors"
          >
            <span className="text-rose-800">अ/A</span>
            <span>{t('language')}</span>
          </button>

          <Link
            href="/cart"
            aria-label="Shopping Bag"
            className="relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span className="hidden sm:inline">{t('cart')}</span>
            <span
              data-testid="cart-count-badge"
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-400 text-stone-950 text-xs font-bold"
            >
              {totalItems}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
