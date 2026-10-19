'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import HeroSection from '../components/HeroSection';
import ProductCard from '../components/ProductCard';
import {
  DEMO_PRODUCTS,
  enrichProduct,
  filterAndSortProducts,
  paginateProducts,
  Product,
  ProductCategory,
  SortOption,
} from '../lib/catalog';
import { API_URL, useT } from '../lib/store';

const CATS = ['all', 'kurti', 'bag', 'accessory'] as const;
const PAGE_SIZE = 8;

export default function ShopPage() {
  const { t, lang } = useT();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [cat, setCat] = useState<(typeof CATS)[number]>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const loadProducts = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/products`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      if (Array.isArray(d.products) && d.products.length > 0) {
        setProducts(d.products.map((p: Product) => enrichProduct(p)));
      } else {
        setProducts(DEMO_PRODUCTS);
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Support category selection from URL query string (e.g. /?category=kurti)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFromUrl = () => {
      const param = new URLSearchParams(window.location.search).get('category');
      if (param === 'kurti' || param === 'bag' || param === 'accessory' || param === 'all') {
        setCat(param);
        setPage(1);
      }
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setPage(1);
  }, [cat, q, sort, inStockOnly]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return filterAndSortProducts(products, {
      category: cat,
      query: q,
      sort,
      inStockOnly,
    });
  }, [products, cat, q, sort, inStockOnly]);

  const paginated = useMemo(() => paginateProducts(filtered, page, PAGE_SIZE), [filtered, page]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, kurti: 0, bag: 0, accessory: 0 };
    if (!products) return counts;
    counts.all = products.length;
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  const resetFilters = () => {
    setCat('all');
    setQ('');
    setSort('featured');
    setInStockOnly(false);
    setPage(1);
  };

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <HeroSection
        onSelectCategory={(selected: 'all' | ProductCategory) => {
          setCat(selected);
          setPage(1);
        }}
      />

      {/* Category Highlights */}
      <section aria-labelledby="categories-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="categories-heading" className="text-xl sm:text-2xl font-bold text-gray-900">
            {t('shopByCategory')}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(
            [
              { key: 'kurti', icon: '👗', descKey: 'categoryKurtiDesc', bg: 'from-rose-50 to-pink-50' },
              { key: 'bag', icon: '👜', descKey: 'categoryBagDesc', bg: 'from-amber-50 to-orange-50' },
              { key: 'accessory', icon: '💍', descKey: 'categoryAccessoryDesc', bg: 'from-purple-50 to-pink-50' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setCat(item.key);
                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`text-left p-5 rounded-2xl border transition-all bg-gradient-to-br ${item.bg} ${
                cat === item.key ? 'border-brand ring-2 ring-brand/20 shadow-sm' : 'border-gray-200 hover:border-brand/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-full text-brand border border-pink-100">
                  {categoryCounts[item.key]} {t('itemsLabel')}
                </span>
              </div>
              <h3 className="font-bold text-base text-gray-900">{t(item.key)}</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{t(item.descKey)}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Main Catalog Section */}
      <section id="catalog" aria-labelledby="catalog-heading" className="space-y-5 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 id="catalog-heading" className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('catalogHeading')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">{t('featuredSubheading')}</p>
          </div>

          {products && (
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              {t('showingResults')} <span className="font-bold text-gray-900">{paginated.items.length}</span> {t('of')}{' '}
              <span className="font-bold text-gray-900">{filtered.length}</span> {t('itemsLabel')}
            </p>
          )}
        </div>

        {/* Search, Category Filter, Sort & Stock Controls */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <label htmlFor="catalog-search" className="sr-only">
                {t('search')}
              </label>
              <input
                id="catalog-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search')}
                className="w-full border border-gray-300 rounded-xl pl-4 pr-9 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:border-brand focus:outline-none"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  aria-label={t('clearSearch')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="catalog-sort" className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                {t('sortBy')}:
              </label>
              <select
                id="catalog-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-brand focus:outline-none"
              >
                <option value="featured">{t('sortFeatured')}</option>
                <option value="price-asc">{t('sortPriceAsc')}</option>
                <option value="price-desc">{t('sortPriceDesc')}</option>
                <option value="newest">{t('sortNewest')}</option>
                <option value="name-asc">{t('sortNameAsc')}</option>
              </select>
            </div>
          </div>

          {/* Category Pills & Stock Checkbox */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product Categories">
              {CATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={cat === c}
                  onClick={() => setCat(c)}
                  className={`whitespace-nowrap text-xs sm:text-sm font-semibold rounded-full px-4 py-1.5 border transition-colors ${
                    cat === c
                      ? 'bg-brand text-white border-brand shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-brand-light'
                  }`}
                >
                  {t(c)} ({categoryCounts[c] ?? 0})
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4"
              />
              <span>{t('inStockOnly')}</span>
            </label>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3"
          >
            <p className="text-red-700 font-medium">{t('errorGeneric')}</p>
            <button
              type="button"
              onClick={loadProducts}
              className="bg-brand text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-brand-dark"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* Loading Skeleton State */}
        {!products && !error && (
          <div aria-live="polite" className="space-y-4">
            <p className="text-gray-500 text-sm">{t('loading')}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white rounded-2xl border p-3 space-y-3 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-xl" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-9 bg-gray-200 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty Filter State */}
        {products && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
            <p className="text-3xl" aria-hidden="true">🔍</p>
            <p className="text-gray-600 font-medium">{t('noProducts')}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-block bg-brand text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-brand-dark"
            >
              {t('resetFilters')}
            </button>
          </div>
        )}

        {/* Product Grid */}
        {products && paginated.items.length > 0 && (
          <div key={lang} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {paginated.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {products && paginated.totalPages > 1 && (
          <nav
            aria-label="Catalog Pagination"
            className="flex items-center justify-center gap-3 pt-4"
          >
            <button
              type="button"
              disabled={paginated.currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 text-sm font-semibold rounded-xl border bg-white hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← {t('prevPage')}
            </button>
            <span className="text-sm font-medium text-gray-700">
              {t('page')} <span className="font-bold">{paginated.currentPage}</span> {t('of')}{' '}
              <span className="font-bold">{paginated.totalPages}</span>
            </span>
            <button
              type="button"
              disabled={paginated.currentPage >= paginated.totalPages}
              onClick={() => setPage((p) => Math.min(paginated.totalPages, p + 1))}
              className="px-4 py-2 text-sm font-semibold rounded-xl border bg-white hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('nextPage')} →
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
