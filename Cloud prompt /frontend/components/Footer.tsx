'use client';
import Link from 'next/link';
import { useT } from '../lib/store';

export default function Footer() {
  const { t } = useT();

  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-600">
        <div className="space-y-2">
          <p className="text-lg font-bold text-brand">{t('brand')}</p>
          <p className="leading-relaxed">{t('footerAbout')}</p>
          <p className="text-xs text-gray-400 pt-1">
            Jaipur, Rajasthan • Bilingual Storefront (EN / HI)
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-gray-900">{t('footerQuickLinks')}</p>
          <ul className="space-y-1.5">
            <li>
              <Link href="/?category=kurti#catalog" className="hover:text-brand">
                {t('navKurtis')}
              </Link>
            </li>
            <li>
              <Link href="/?category=bag#catalog" className="hover:text-brand">
                {t('navBags')}
              </Link>
            </li>
            <li>
              <Link href="/?category=accessory#catalog" className="hover:text-brand">
                {t('navAccessories')}
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-brand">
                {t('cart')}
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-brand">
                {t('navAdmin')}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-gray-900">{t('footerSecurity')}</p>
          <p className="leading-relaxed text-xs text-gray-500">{t('footerSecurityDesc')}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
              🔒 HMAC Webhook Verified
            </span>
            <span className="text-[11px] bg-pink-50 text-brand border border-pink-200 px-2.5 py-0.5 rounded-full font-medium">
              ⚡ 240s Atomic QR Lock
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400 px-4">
        © {new Date().getFullYear()} {t('brand')} — Demo E-Commerce & Payment Verification Bridge
      </div>
    </footer>
  );
}
