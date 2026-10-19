'use client';
import { ProductCategory, useT } from '../lib/store';

export default function HeroSection({
  onSelectCategory,
}: {
  onSelectCategory?: (cat: 'all' | ProductCategory) => void;
}) {
  const { t } = useT();

  const handleBrowse = (cat: 'all' | ProductCategory) => {
    if (onSelectCategory) onSelectCategory(cat);
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 border border-pink-100 p-6 sm:p-10 mb-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/90 text-brand border border-pink-200 px-3 py-1 rounded-full shadow-sm">
            ✨ {t('heroBadge')}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleBrowse('all')}
              className="bg-brand text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors shadow-sm"
            >
              {t('heroCtaPrimary')} →
            </button>
            <button
              type="button"
              onClick={() => handleBrowse('kurti')}
              className="bg-white text-brand font-semibold text-sm px-6 py-3 rounded-xl border border-pink-200 hover:bg-brand-light transition-colors"
            >
              👗 {t('heroCtaSecondary')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 text-xs font-medium text-gray-700">
            <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2 border border-pink-100">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{t('trustVerified')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2 border border-pink-100">
              <span className="text-brand font-bold">⚡</span>
              <span>{t('trustSpeed')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2 border border-pink-100">
              <span className="text-amber-600 font-bold">अ</span>
              <span>{t('trustBilingual')}</span>
            </div>
          </div>
        </div>

        {/* Visual Showcase Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleBrowse('kurti')}
            className="col-span-1 row-span-2 bg-white rounded-2xl p-3 border border-pink-100 shadow-sm hover:shadow-md transition-all text-left group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/products/kurti2.svg"
              alt={t('navKurtis')}
              className="w-full aspect-square object-cover rounded-xl mb-2 group-hover:scale-[1.02] transition-transform"
            />
            <p className="font-bold text-sm text-gray-900">{t('navKurtis')}</p>
            <p className="text-xs text-brand font-semibold">From ₹799</p>
          </button>

          <button
            type="button"
            onClick={() => handleBrowse('bag')}
            className="bg-white rounded-2xl p-2.5 border border-pink-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/products/bag2.svg"
              alt={t('navBags')}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            />
            <div>
              <p className="font-bold text-xs sm:text-sm text-gray-900">{t('navBags')}</p>
              <p className="text-xs text-brand font-semibold">From ₹599</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleBrowse('accessory')}
            className="bg-white rounded-2xl p-2.5 border border-pink-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/products/acc1.svg"
              alt={t('navAccessories')}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            />
            <div>
              <p className="font-bold text-xs sm:text-sm text-gray-900">{t('navAccessories')}</p>
              <p className="text-xs text-brand font-semibold">From ₹249</p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
