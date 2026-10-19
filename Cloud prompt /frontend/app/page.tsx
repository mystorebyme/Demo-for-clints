'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard, { extractProductShade, formatEthnicSizeLabel } from '../components/ProductCard';
import {
  filterAndSortProducts,
  getProductPriceForSize,
  paginateProducts,
  Product,
  ProductCategory,
  SortOption,
} from '../lib/catalog';
import { rupees, useStore } from '../lib/store';

export default function HomePage() {
  const { lang, compareList, toggleCompare, clearCompare, addToCart, t } = useStore();
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Products are fetched exclusively from the backend /api/products endpoint (not hardcoded in frontpage code)
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('featured');
  const [sizeFilter, setSizeFilter] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoadingCatalog(true);
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingCatalog(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      filterAndSortProducts(products, {
        category,
        query,
        sort,
        inStockOnly,
        sizeFilter,
      }),
    [products, category, query, sort, inStockOnly, sizeFilter]
  );

  const paginated = useMemo(() => paginateProducts(filtered, page, 12), [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [category, query, sort, inStockOnly, sizeFilter]);

  const selectCategoryAndScroll = (
    cat: ProductCategory | 'all',
    presetQuery = '',
    presetSort: SortOption = 'featured'
  ) => {
    setCategory(cat);
    setQuery(presetQuery);
    setSort(presetSort);
    const el = document.getElementById('collection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const storyCircles = [
    {
      key: 'suit-anarkali',
      label: lang === 'hi' ? 'अनारकली व सूट' : 'Anarkali & Suit Set',
      img: '/products/kurti1.jpg',
      cat: 'kurti' as const,
      q: 'Anarkali',
      sort: 'featured' as SortOption,
    },
    {
      key: 'printed-kurti',
      label: lang === 'hi' ? 'प्रिंटेड कुर्ता सेट' : 'Printed Kurta Set',
      img: '/products/kurti2.jpg',
      cat: 'kurti' as const,
      q: '',
      sort: 'featured' as SortOption,
    },
    {
      key: 'bridal-potli',
      label: lang === 'hi' ? 'ब्राइडल पोटली व बैग्स' : 'Potli & Handbags',
      img: '/products/bag1.jpg',
      cat: 'bag' as const,
      q: '',
      sort: 'featured' as SortOption,
    },
    {
      key: 'jadau-jewellery',
      label: lang === 'hi' ? 'जड़ाऊ ज्वेलरी' : 'Jadau & Dupattas',
      img: '/products/acc3.jpg',
      cat: 'accessory' as const,
      q: '',
      sort: 'featured' as SortOption,
    },
    {
      key: 'new-arrival',
      label: lang === 'hi' ? 'न्यू अराइवल' : 'New Arrival',
      img: '/products/kurti3.jpg',
      cat: 'all' as const,
      q: '',
      sort: 'price-desc' as SortOption,
    },
    {
      key: 'best-selling',
      label: lang === 'hi' ? 'बेस्ट सेलिंग' : 'Best Selling',
      img: '/products/kurti4.jpg',
      cat: 'all' as const,
      q: '',
      sort: 'rating' as SortOption,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      <Header />

      {/* Curated Collection Story Circles (Inspired by thestoreofbufani.com & jaypore.com) */}
      <div className="bg-white border-b border-stone-200 px-3 sm:px-6 py-3.5 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between sm:justify-center gap-4 sm:gap-8 min-w-max">
          {storyCircles.map((c) => {
            const active = category === c.cat && query === c.q && sort === c.sort;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => selectCategoryAndScroll(c.cat, c.q, c.sort)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 border-2 transition ${
                    active
                      ? 'border-rose-900 scale-105 shadow-md'
                      : 'border-amber-400/80 group-hover:border-rose-800'
                  }`}
                >
                  <img
                    src={c.img}
                    alt={c.label}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-xs uppercase tracking-wider font-bold ${
                    active ? 'text-rose-900 font-extrabold' : 'text-stone-700 group-hover:text-rose-900'
                  }`}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cinematic Luxury Editorial Hero Section */}
      <section className="relative bg-gradient-to-br from-stone-950 via-rose-950 to-stone-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-[11px] sm:text-xs font-semibold uppercase tracking-widest">
              <span>{t('heroBadge')}</span>
            </div>

            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-[1.15]">
              {t('heroTitle')}
            </h1>

            <p className="text-stone-200/90 text-xs sm:text-base leading-relaxed max-w-xl">
              {t('heroSubtitle')}
            </p>

            <div className="flex flex-wrap gap-2.5 sm:gap-3.5 pt-1">
              <a
                href="#collection"
                className="px-5 sm:px-7 py-3 sm:py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all"
              >
                {t('shopNow')}
              </a>
              <button
                type="button"
                onClick={() => selectCategoryAndScroll('kurti')}
                className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider backdrop-blur-sm transition-all"
              >
                {t('categoryKurti')}
              </button>
            </div>

            {/* Trust Metrics */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-white/15 text-[11px] sm:text-xs">
              <div>
                <p className="text-lg sm:text-2xl font-serif font-bold text-amber-300">216+</p>
                <p className="text-stone-300 mt-0.5">
                  {lang === 'hi' ? 'जयपुर हैंडलूम डिज़ाइन' : 'Curated Jaipur Designs'}
                </p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-serif font-bold text-amber-300">Free</p>
                <p className="text-stone-300 mt-0.5">
                  {lang === 'hi' ? 'एक्सप्रेस डिलीवरी (₹999+)' : 'Express Delivery ₹999+'}
                </p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-serif font-bold text-amber-300">4.9 / 5</p>
                <p className="text-stone-300 mt-0.5">
                  {lang === 'hi' ? '12,400+ संतुष्ट ग्राहक' : '12,400+ Happy Patrons'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Editorial Photo Collage with Real Studio Photography */}
          <div className="lg:col-span-6 grid grid-cols-12 gap-2.5 sm:gap-3.5 items-center">
            <div className="col-span-7 relative group overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-amber-300/30 shadow-2xl aspect-[4/5]">
              <img
                src="/products/kurti1.jpg"
                alt="Sanganeri Hand-Block Mulmul Anarkali"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 text-white">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-300 font-bold block">
                  Jaipur Verandah Edit
                </span>
                <p className="font-serif font-bold text-xs sm:text-lg">
                  Sanganeri Floral Mulmul Anarkali
                </p>
              </div>
            </div>

            <div className="col-span-5 space-y-2.5 sm:space-y-3.5">
              <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-300/30 shadow-xl aspect-square">
                <img
                  src="/products/acc3.jpg"
                  alt="Bikaneri Jadau Polki Bridal Choker"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <span className="text-[9px] uppercase tracking-widest text-amber-300 font-bold block">
                    Royal Polki
                  </span>
                  <p className="font-serif font-bold text-[11px] sm:text-sm text-white">
                    Bikaneri Jadau Choker
                  </p>
                </div>
              </div>

              <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-300/30 shadow-xl aspect-square">
                <img
                  src="/products/bag1.jpg"
                  alt="Handcrafted Kutchi Peacock Sling Bag"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <span className="text-[9px] uppercase tracking-widest text-amber-300 font-bold block">
                    Artisan Guild
                  </span>
                  <p className="font-serif font-bold text-[11px] sm:text-sm text-white">
                    Mor-Bani Embroidered Bag
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Controls & 2-Column Mobile / 4-Column Desktop Product Grid */}
      <main id="collection" className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div id="catalog" className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-3.5 sm:p-5 mb-6 sm:mb-8 shadow-sm space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Category Tabs (Horizontally Scrollable on Mobile) */}
            <div
              className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0"
              role="tablist"
              aria-label="Product Categories"
            >
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
                  className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
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
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative flex-1 min-w-[160px] sm:w-64">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label="Search products"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <svg
                  className="w-4 h-4 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2"
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
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                aria-label="Filter by Size"
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">{lang === 'hi' ? 'सभी साइज़' : 'All Sizes'}</option>
                <option value="S">Size: S [36]</option>
                <option value="M">Size: M [38]</option>
                <option value="L">Size: L [40]</option>
                <option value="XL">Size: XL [42]</option>
                <option value="XXL">Size: XXL [44]</option>
                <option value="Compact">Bag: Compact</option>
                <option value="Regular">Bag: Regular</option>
                <option value="Large Bridal">Bag: Large Bridal</option>
                <option value="2.25m">Dupatta: 2.25m</option>
                <option value="2.50m">Dupatta: 2.50m</option>
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                aria-label="Sort products"
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="featured">{t('sortFeatured')}</option>
                <option value="price-asc">{t('sortPriceLowHigh')}</option>
                <option value="price-desc">{t('sortPriceHighLow')}</option>
                <option value="rating">{t('sortRating')}</option>
              </select>

              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer select-none px-1.5 py-1">
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

          <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-500 pt-2 border-t border-stone-100">
            <span>{t('resultsFound', { count: filtered.length })}</span>
            <span>
              {t('page')} {paginated.currentPage} {t('of')} {paginated.totalPages}
            </span>
          </div>
        </div>

        {/* 2-Column Mobile Grid / 4-Column Desktop Grid */}
        {loadingCatalog && products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 overflow-hidden animate-pulse"
              >
                <div className="aspect-[3/4] sm:aspect-[4/5] bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-stone-200 rounded w-1/3" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-8 bg-stone-200 rounded w-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center">
            <p className="text-stone-600 font-medium mb-3">
              No matching pieces found in this filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setQuery('');
                setSizeFilter('');
                setInStockOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-rose-900 text-white text-xs font-semibold"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {paginated.items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {paginated.totalPages > 1 && (
          <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={paginated.currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50"
            >
              {t('previous')}
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
              {t('next')}
            </button>
          </div>
        )}
      </main>

      {/* Curated Worlds — 3 Luxury Category Bento Tiles */}
      <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] font-extrabold text-rose-900">
              KURTIS / ARTISAN BAGS / JADAU JEWELLERY
            </p>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              {lang === 'hi' ? 'रॉयल जयपुर कलेक्शंस' : 'Shop by Royal Collection'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              id: 'kurti' as const,
              title: lang === 'hi' ? 'शाही कुर्तियाँ और अनारकली' : 'Royal Kurtis & Anarkalis',
              sub: 'Sanganeri Mulmul / Chanderi Zardozi / Chikankari',
              img: '/products/kurti2.jpg',
              tag: 'Festive Bestsellers',
              count: products.filter((x) => x.category === 'kurti').length || 96,
            },
            {
              id: 'bag' as const,
              title: lang === 'hi' ? 'दस्तकारी बैग्स और पोटली' : 'Artisan Bags & Bridal Potlis',
              sub: 'Kutchi Abhla Mirror-Work / Dabu Totes / Velvet Potlis',
              img: '/products/bag2.jpg',
              tag: 'Handcrafted Guild',
              count: products.filter((x) => x.category === 'bag').length || 60,
            },
            {
              id: 'accessory' as const,
              title: lang === 'hi' ? 'बीकानेरी जड़ाऊ और दुपट्टे' : 'Jadau Jewellery & Silk Drapes',
              sub: 'Meenakari Jhumkas / Polki Chokers / Ajrakh Silk',
              img: '/products/acc1.jpg',
              tag: 'Heirloom Edition',
              count: products.filter((x) => x.category === 'accessory').length || 60,
            },
          ].map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => selectCategoryAndScroll(tile.id)}
              className="group relative aspect-[16/10] md:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden text-left shadow-md hover:shadow-xl transition-all border border-stone-200"
            >
              <img
                src={tile.img}
                alt={tile.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent" />
              <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/90 text-stone-900 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                  {tile.tag}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-stone-950/85 text-amber-300 text-[10px] font-mono font-bold backdrop-blur-sm">
                  {tile.count} Products
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                  {tile.sub}
                </p>
                <h3 className="text-lg sm:text-2xl font-serif font-bold mt-0.5 flex items-center justify-between">
                  <span>{tile.title}</span>
                </h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4-Pillar Service Guarantee Strip (Inspired by thestoreofbufani.com) */}
      <section className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-stone-950 text-white rounded-3xl p-4 sm:p-6 border border-stone-800 shadow-sm">
          {[
            {
              title: lang === 'hi' ? 'फ्री इंश्योर्ड शिपिंग' : 'ALL INDIA INSURED SHIPPING',
              desc:
                lang === 'hi'
                  ? '₹999+ के सभी ऑर्डर्स पर पैन-इंडिया एक्सप्रेस डिलीवरी'
                  : 'Free Delhivery / BlueDart Express on orders ₹999+',
            },
            {
              title: lang === 'hi' ? 'स्टोर ओनर डायरेक्ट सपोर्ट' : 'DIRECT ATELIER SUPPORT',
              desc:
                lang === 'hi'
                  ? 'हर आइटम पर सीधे स्टोर ओनर से ईमेल व व्हाट्सएप संपर्क'
                  : 'Direct inquiry & WhatsApp assistance from our Jaipur guild',
            },
            {
              title: lang === 'hi' ? '7-दिन साइज एक्सचेंज' : 'REPLACEMENT & SIZE EXCHANGE',
              desc:
                lang === 'hi'
                  ? '24x7 CCTV निगरानी में पैकिंग और आसान एक्सचेंज'
                  : 'Packed under 24x7 CCTV with 7-day size exchange guarantee',
            },
            {
              title: lang === 'hi' ? '100% सुरक्षित पेमेंट व GST बिल' : '100% SECURED & GST BILLED',
              desc:
                lang === 'hi'
                  ? 'वेरीफाइड UPI, कार्ड और तुरंत CGST नियम 46(b) टैक्स इनवॉइस'
                  : 'Verified UPI / Razorpay & instant CGST Rule 46(b) Tax Invoice',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10"
            >
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-300">
                {item.title}
              </p>
              <p className="text-[11px] sm:text-xs text-stone-300 mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Maison Story Section */}
      <section
        id="about-maison"
        className="bg-white border-t border-stone-200 py-12 sm:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-stone-200">
              <img
                src="/editorial/about-portrait.jpg"
                alt="Royal Rajasthani Miniature & Jadau Polki Craftsmanship"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-stone-200 translate-y-4 sm:translate-y-6">
              <img
                src="/editorial/collection-heritage.jpg"
                alt="Heirloom Ruby & Emerald Kundan Necklace"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-rose-900">
              THE MAISON / JOHARI BAZAR, JAIPUR
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 leading-tight">
              {lang === 'hi'
                ? 'कला, विरासत और राजपूताना दस्तकारी का संगम'
                : 'Inspired by Royal Craft, Handloom & Heritage'}
            </h2>
            <p className="text-xs sm:text-base text-stone-600 leading-relaxed">
              {lang === 'hi'
                ? 'ज़रिया जयपुर (Zariya Jaipur) में हर कुर्ती, पोटली और जड़ाऊ आभूषण पीढ़ियों से काम कर रहे उस्ताद कारीगरों द्वारा हाथ से तैयार किया जाता है। सांगानेरी हैंड-ब्लॉक मलमल से लेकर बीकानेरी कुंदन मीनाकारी तक, हर ऑर्डर के साथ आपको आधिकारिक GST टैक्स बिल और लाइव ट्रैकिंग की सुविधा मिलती है।'
                : 'Zariya Jaipur is a contemporary Indian ethnic couture & heritage house rooted in Jaipur’s artisan guilds. From Sanganeri hand-block printed mulmul and Lucknowi Chikankari to Kutchi mirror-work bags and Bikaneri Jadau Polki, every creation is handcrafted slowly to be worn, loved, and passed on.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <p className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                  100% Handloom & Craft
                </p>
                <p className="text-xs text-stone-600 mt-1">
                  Directly sourced from master block-printers & karigars in Jaipur, Lucknow & Bhuj.
                </p>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <p className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                  Official GST Tax Bill
                </p>
                <p className="text-xs text-stone-600 mt-1">
                  Instant downloadable CGST Rule 46(b) Invoice & email receipt with every order.
                </p>
              </div>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <p className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                  Insured Express Delivery
                </p>
                <p className="text-xs text-stone-600 mt-1">
                  Real-time 12-digit AWB shipment tracking with 7-day hassle-free size exchange.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
