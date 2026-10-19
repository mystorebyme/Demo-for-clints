'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import {
  DEMO_PRODUCTS,
  filterAndSortProducts,
  paginateProducts,
  Product,
  ProductCategory,
  SortOption,
} from '../lib/catalog';
import { useStore } from '../lib/store';

export default function HomePage() {
  const { lang, appliedCoupon, setAppliedCoupon, t } = useStore();

  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      filterAndSortProducts(products, {
        category,
        query,
        sort,
        inStockOnly,
      }),
    [products, category, query, sort, inStockOnly]
  );

  const paginated = useMemo(() => paginateProducts(filtered, page, 8), [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [category, query, sort, inStockOnly]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Royal Assurance Strip (No Demo/Sample labels — pure Flagship Brand UX) */}
      <div className="bg-amber-50/90 border-b border-amber-200/80 text-amber-950 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="px-2 py-0.5 rounded bg-amber-300/80 font-extrabold uppercase tracking-wider text-[10px]">
              JAIPUR ATELIER
            </span>
            <span>{t('demoNoticeBanner')}</span>
          </div>
          <div className="flex items-center gap-3 font-bold">
            <Link href="/track" className="text-rose-900 hover:underline">
              📦 {t('trackOrderNav')}
            </Link>
            <span>•</span>
            <Link href="/wishlist" className="text-rose-900 hover:underline">
              ♥ {t('wishlistTitle')}
            </Link>
          </div>
        </div>
      </div>

      {/* Editorial Luxury Hero Section */}
      <section className="relative bg-gradient-to-br from-rose-950 via-rose-900 to-amber-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold uppercase tracking-widest mb-4">
              {t('heroBadge')}
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight leading-tight mb-4">
              {t('heroTitle')}
            </h1>
            <p className="text-rose-100/90 text-sm sm:text-base leading-relaxed mb-7">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#catalog"
                className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-sm shadow-md transition-colors"
              >
                {t('shopNow')} →
              </a>
              <Link
                href="/track"
                className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-sm transition-colors"
              >
                📦 {t('trackOrderNav')}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto max-w-md">
            <img
              src="/products/kurti2.svg"
              alt="Maharani Zardozi Anarkali"
              className="w-28 sm:w-32 aspect-[4/5] rounded-2xl object-cover border-2 border-amber-300/40 shadow-lg"
            />
            <img
              src="/products/bag3.svg"
              alt="Zardozi Bridal Potli"
              className="w-28 sm:w-32 aspect-[4/5] rounded-2xl object-cover border-2 border-amber-300/40 shadow-lg translate-y-3"
            />
            <img
              src="/products/acc3.svg"
              alt="Bikaneri Jadau Kundan Choker"
              className="w-28 sm:w-32 aspect-[4/5] rounded-2xl object-cover border-2 border-amber-300/40 shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Interactive Privilege Code Bar (1-Tap Apply) */}
      <section className="bg-white border-b border-stone-200 py-3.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-800">
            <span className="text-base">🎟️</span>
            <span>
              {lang === 'hi'
                ? 'विशेष फेस्टिव ऑफर्स (टैप करके शॉपिंग बैग में लागू करें):'
                : 'Boutique Privilege Codes (Tap any code to auto-apply at checkout):'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { code: 'FIRST10', label: 'FIRST10 • 10% OFF' },
              { code: 'DIWALI20', label: 'DIWALI20 • 20% OFF (₹1,299+)' },
              { code: 'JAIPUR15', label: 'JAIPUR15 • 15% OFF (₹999+)' },
              { code: 'ROYAL250', label: 'ROYAL250 • Flat ₹250 OFF' },
            ].map((c) => {
              const active = appliedCoupon === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setAppliedCoupon(active ? '' : c.code)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition ${
                    active
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                      : 'bg-amber-50 hover:bg-amber-100 text-rose-950 border-amber-300'
                  }`}
                >
                  {active ? `✓ ${c.code} Applied` : c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Catalog Controls & Grid */}
      <main id="catalog" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-8 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Product Categories">
              {(
                [
                  { id: 'all', label: t('allCategories') },
                  { id: 'kurti', label: t('categoryKurti') },
                  { id: 'bag', label: t('categoryBag') },
                  { id: 'accessory', label: t('categoryAccessory') },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={category === tab.id}
                  onClick={() => setCategory(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    category === tab.id
                      ? 'bg-rose-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search, Sort & In-Stock Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label="Search products"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <svg
                  className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15z"
                  />
                </svg>
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                aria-label="Sort products"
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="featured">{t('sortFeatured')}</option>
                <option value="price-asc">{t('sortPriceLowHigh')}</option>
                <option value="price-desc">{t('sortPriceHighLow')}</option>
                <option value="rating">{t('sortRating')}</option>
              </select>

              <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-stone-700 cursor-pointer select-none px-2 py-1">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-stone-300 text-rose-800 focus:ring-rose-500"
                />
                <span>{t('inStockOnly')}</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
            <span>{t('resultsFound', { count: filtered.length })}</span>
            <span>
              {t('page')} {paginated.currentPage} {t('of')} {paginated.totalPages}
            </span>
          </div>
        </div>

        {/* Product Grid */}
        {paginated.items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <p className="text-stone-600 font-medium mb-3">
              No matching couture pieces found.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setQuery('');
                setInStockOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-rose-900 text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginated.items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {paginated.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={paginated.currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50"
            >
              ← {t('previous')}
            </button>
            <span className="text-xs font-bold text-stone-700 px-3 py-2">
              {t('page')} {paginated.currentPage} {t('of')} {paginated.totalPages}
            </span>
            <button
              type="button"
              disabled={paginated.currentPage >= paginated.totalPages}
              onClick={() => setPage((prev) => Math.min(paginated.totalPages, prev + 1))}
              className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50"
            >
              {t('next')} →
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
