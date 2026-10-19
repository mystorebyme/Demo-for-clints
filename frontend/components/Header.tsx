'use client';
import { useState } from 'react';
import Link from 'next/link';
import { rupees, useCart, useHydrated, useLang, useT } from '../lib/store';

export default function Header() {
  const { t, lang } = useT();
  const setLang = useLang((s) => s.setLang);
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price_paise * l.qty, 0);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-pink-100 shadow-sm">
      <div
        role="region"
        aria-label="Demo Storefront Notice"
        className="bg-gray-900 text-gray-100 text-xs py-1.5 px-4 text-center font-medium"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2 align-middle" />
        {t('demoBanner')}
      </div>

      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-brand-light"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
            <span className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-brand-dark transition-colors">
              K
            </span>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-brand block leading-none">
                {t('brand')}
              </span>
              <span className="text-[11px] text-gray-500 hidden sm:block mt-0.5">
                {t('tagline')}
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Category & Tracking Navigation */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-700">
          <Link href="/" className="hover:text-brand transition-colors">
            {t('navHome')}
          </Link>
          <Link href="/?category=kurti#catalog" className="hover:text-brand transition-colors">
            {t('navKurtis')}
          </Link>
          <Link href="/?category=bag#catalog" className="hover:text-brand transition-colors">
            {t('navBags')}
          </Link>
          <Link href="/?category=accessory#catalog" className="hover:text-brand transition-colors">
            {t('navAccessories')}
          </Link>
          <Link
            href="/track"
            className="inline-flex items-center gap-1 text-brand font-semibold bg-pink-50 px-3 py-1 rounded-full border border-pink-200 hover:bg-brand hover:text-white transition-colors"
          >
            <span>📦</span>
            <span>{t('navTrack')}</span>
          </Link>
          <Link href="/admin" className="text-gray-500 hover:text-brand transition-colors">
            {t('navAdmin')}
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="text-xs sm:text-sm font-semibold border border-pink-200 bg-pink-50/60 text-brand-dark rounded-full px-3.5 py-1.5 hover:bg-brand hover:text-white transition-colors focus:ring-2 focus:ring-brand/30"
            aria-label={lang === 'en' ? 'Switch language to Hindi (हिंदी)' : 'Switch language to English'}
          >
            🌐 {lang === 'en' ? 'हिंदी' : 'English'}
          </button>

          <Link
            href="/cart"
            className="relative flex items-center gap-2 text-xs sm:text-sm font-semibold bg-brand text-white rounded-full px-4 py-1.5 hover:bg-brand-dark transition-colors shadow-sm"
            aria-label={`${t('cart')}${hydrated && count > 0 ? ` (${count} items, ${rupees(subtotal)})` : ''}`}
          >
            <span aria-hidden="true">🛒</span>
            <span>{t('cart')}</span>
            {hydrated && count > 0 && (
              <span className="bg-white text-brand font-bold text-xs rounded-full px-2 py-0.5 leading-none">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-2 text-sm font-medium"
        >
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-2 rounded hover:bg-brand-light">
            {t('navHome')}
          </Link>
          <Link
            href="/?category=kurti#catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 px-2 rounded hover:bg-brand-light"
          >
            👗 {t('navKurtis')}
          </Link>
          <Link
            href="/?category=bag#catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 px-2 rounded hover:bg-brand-light"
          >
            👜 {t('navBags')}
          </Link>
          <Link
            href="/?category=accessory#catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 px-2 rounded hover:bg-brand-light"
          >
            💍 {t('navAccessories')}
          </Link>
          <Link
            href="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 px-2 rounded font-bold text-brand hover:bg-brand-light"
          >
            📦 {t('navTrack')}
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 px-2 rounded text-gray-600 hover:bg-brand-light"
          >
            ⚙️ {t('navAdmin')}
          </Link>
        </nav>
      )}
    </header>
  );
}
