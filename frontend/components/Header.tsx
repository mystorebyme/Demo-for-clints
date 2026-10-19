'use client';
import Link from 'next/link';
import { useCart, useHydrated, useLang, useT } from '../lib/store';

export default function Header() {
  const { t, lang } = useT();
  const setLang = useLang((s) => s.setLang);
  const hydrated = useHydrated();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));

  return (
    <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand">
          {t('brand')}
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="text-sm border rounded-full px-3 py-1 hover:bg-brand-light"
            aria-label="Toggle language"
          >
            {lang === 'en' ? 'हिंदी' : 'English'}
          </button>
          <Link href="/cart" className="relative text-sm font-medium border rounded-full px-3 py-1 hover:bg-brand-light">
            🛒 {t('cart')}
            {hydrated && count > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
