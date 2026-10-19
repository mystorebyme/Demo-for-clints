'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '../lib/store';

export default function Footer() {
  const { t } = useStore();

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-800 to-amber-700 flex items-center justify-center text-amber-100 font-serif font-bold text-sm">
              ZJ
            </div>
            <span className="text-lg font-bold text-white">{t('brand')}</span>
          </div>
          <p className="text-sm text-stone-400 leading-relaxed">{t('footerAbout')}</p>
          <p className="text-xs text-stone-500 mt-3 font-mono">
            GSTIN: 08AABCK7412R1Z5 • MI Road, Jaipur – 302001
          </p>
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
              <Link
                href="/track"
                className="hover:text-amber-300 transition-colors font-semibold text-amber-200"
              >
                📦 {t('trackOrderNav')}
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-amber-300 transition-colors">
                {t('cart')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            {t('footerSupport')}
          </h3>
          <ul className="space-y-2 text-xs text-stone-400">
            <li>🔒 256-Bit HMAC Webhook Verified Payments</li>
            <li>🧾 Automated GST Tax Invoice (CGST / SGST / IGST)</li>
            <li>📧 Instant Email Receipt & Confidential Tracking ID</li>
            <li>💬 Priority WhatsApp Concierge: +91-9876543210</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-900 py-4 px-4 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {t('brand')} • Zariya Heritage Craft Pvt. Ltd., Jaipur
          </span>
          <Link
            href="/admin"
            className="text-stone-600 hover:text-stone-400 transition-colors text-[11px]"
            title="Direct Merchant Portal Link"
          >
            🔒 Merchant Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
