'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '../lib/store';

export default function Footer() {
  const { t } = useStore();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-rose-700 flex items-center justify-center text-white font-bold text-sm">
              KC
            </div>
            <span className="text-lg font-bold text-white">{t('brand')}</span>
          </div>
          <p className="text-sm text-stone-400 leading-relaxed">{t('footerAbout')}</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            {t('footerQuickLinks')}
          </h3>
          <ul className="space-y-2 text-sm">
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
              <Link href="/track" className="hover:text-amber-300 transition-colors font-semibold text-amber-200">
                📦 {t('trackOrderNav')}
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-amber-300 transition-colors">
                {t('cart')}
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-amber-300 transition-colors">
                {t('adminTitle')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            {t('footerSupport')}
          </h3>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>✓ Server-Authoritative Pricing & Coupons</li>
            <li>✓ Printable GST Tax Invoice (PDF)</li>
            <li>✓ Automatic Live Stock Deduction</li>
            <li>✓ Live Order Tracking & WhatsApp Support</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-800 py-4 px-4 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {t('brand')} • Demo Storefront & Operations Suite
      </div>
    </footer>
  );
}
