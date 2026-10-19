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

  const selectCategoryAndScroll = (cat: ProductCategory | 'all') => {
    setCategory(cat);
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      <Header />

      {/* Top Royal Assurance Strip */}
      <div className="bg-stone-950 text-amber-200/95 text-xs py-2.5 px-4 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 font-medium">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-extrabold uppercase tracking-widest text-[10px]">
              JOHARI BAZAR • JAIPUR
            </span>
            <span className="text-stone-200">{t('demoNoticeBanner')}</span>
          </div>
          <div className="flex items-center gap-4 font-bold text-amber-300">
            <Link href="/track" className="hover:text-white transition">
              📦 {t('trackOrderNav')}
            </Link>
            <span className="text-stone-600">•</span>
            <Link href="/wishlist" className="hover:text-white transition">
              ♥ {t('wishlistTitle')}
            </Link>
          </div>
        </div>
      </div>

      {/* Cinematic Luxury Editorial Hero Section (Parka & Jaipura Window Inspired) */}
      <section className="relative bg-gradient-to-br from-stone-950 via-rose-950 to-stone-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-xs font-semibold uppercase tracking-widest">
              <span>✦</span>
              <span>{t('heroBadge')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-[1.12]">
              {t('heroTitle')}
            </h1>

            <p className="text-stone-200/90 text-sm sm:text-base leading-relaxed max-w-xl">
              {t('heroSubtitle')}
            </p>

            <div className="flex flex-wrap gap-3.5 pt-2">
              <a
                href="#catalog"
                className="px-7 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-sm shadow-lg transition-all"
              >
                {t('shopNow')} →
              </a>
              <Link
                href="/track"
                className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-sm backdrop-blur-sm transition-all"
              >
                📦 {t('trackOrderNav')}
              </Link>
              <a
                href="#about-maison"
                className="px-5 py-4 rounded-2xl border border-amber-300/30 hover:border-amber-300 text-amber-200 font-semibold text-sm transition-all"
              >
                {lang === 'hi' ? 'हमारी विरासत' : 'The Maison Story'}
              </a>
            </div>

            {/* Trust Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/15 text-xs">
              <div>
                <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">100%</p>
                <p className="text-stone-300 mt-0.5">
                  {lang === 'hi' ? 'हैंडलूम और जड़ाऊ शिल्प' : 'Authentic Artisan Craft'}
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">Instant</p>
                <p className="text-stone-300 mt-0.5">
                  {lang === 'hi' ? 'ईमेल GST बिल + ट्रैकिंग' : 'Email GST Invoice & Track ID'}
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-serif font-bold text-amber-300">4.9 ★</p>
                <p className="text-stone-300 mt-0.5">
                  {lang === 'hi' ? '12,400+ संतुष्ट ग्राहक' : '12,400+ Verified Patrons'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Editorial Photo Collage with Real Studio Photography */}
          <div className="lg:col-span-6 grid grid-cols-12 gap-3.5 items-center">
            <div className="col-span-7 relative group overflow-hidden rounded-3xl border-2 border-amber-300/30 shadow-2xl aspect-[4/5]">
              <img
                src="/products/kurti1.jpg"
                alt="Sanganeri Hand-Block Mulmul Anarkali"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold block">
                  Jaipur Verandah Edit
                </span>
                <p className="font-serif font-bold text-base sm:text-lg">
                  Sanganeri Floral Mulmul Anarkali
                </p>
              </div>
            </div>

            <div className="col-span-5 space-y-3.5">
              <div className="relative group overflow-hidden rounded-3xl border border-amber-300/30 shadow-xl aspect-[4/4]">
                <img
                  src="/products/acc3.jpg"
                  alt="Bikaneri Jadau Polki Bridal Choker"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-[9px] uppercase tracking-widest text-amber-300 font-bold block">
                    Royal Polki
                  </span>
                  <p className="font-serif font-bold text-xs sm:text-sm text-white">
                    Bikaneri Jadau Choker
                  </p>
                </div>
              </div>

              <div className="relative group overflow-hidden rounded-3xl border border-amber-300/30 shadow-xl aspect-[4/4]">
                <img
                  src="/products/bag1.jpg"
                  alt="Handcrafted Kutchi Peacock Sling Bag"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-[9px] uppercase tracking-widest text-amber-300 font-bold block">
                    Artisan Guild
                  </span>
                  <p className="font-serif font-bold text-xs sm:text-sm text-white">
                    Mor-Bani Embroidered Bag
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Privilege Code Bar (1-Tap Apply) */}
      <section className="bg-white border-b border-stone-200 py-3.5 px-4 shadow-sm">
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

      {/* Curated Worlds — 3 Luxury Category Bento Tiles (Copied from Parka UI Pattern) */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-rose-900">
              KURTIS • ARTISAN BAGS • JADAU JEWELLERY
            </p>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 mt-1">
              {lang === 'hi' ? 'रॉयल जयपुर कलेक्शंस' : 'Curated Worlds of Zariya'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => selectCategoryAndScroll('all')}
            className="text-xs font-extrabold uppercase tracking-widest text-rose-900 hover:underline"
          >
            {lang === 'hi' ? 'सभी 12 उत्पाद देखें →' : 'View Full Collection (12 Pieces) →'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              id: 'kurti' as const,
              title: lang === 'hi' ? 'शाही कुर्तियाँ और अनारकली' : 'Royal Kurtis & Anarkalis',
              sub: 'Sanganeri Mulmul • Chanderi Zardozi • Chikankari',
              img: '/products/kurti2.jpg',
              tag: '4 Signature Ensembles',
            },
            {
              id: 'bag' as const,
              title: lang === 'hi' ? 'दस्तकारी बैग्स और पोटली' : 'Artisan Bags & Bridal Potlis',
              sub: 'Kutchi Abhla Mirror-Work • Dabu Totes • Velvet Potlis',
              img: '/products/bag2.jpg',
              tag: '4 Handcrafted Pieces',
            },
            {
              id: 'accessory' as const,
              title: lang === 'hi' ? 'बीकानेरी जड़ाऊ और दुपट्टे' : 'Jadau Jewellery & Silk Drapes',
              sub: 'Meenakari Jhumkas • Polki Chokers • Ajrakh Silk',
              img: '/products/acc1.jpg',
              tag: '4 Heirloom Editions',
            },
          ].map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => selectCategoryAndScroll(tile.id)}
              className="group relative aspect-[4/5] rounded-3xl overflow-hidden text-left shadow-md hover:shadow-xl transition-all border border-stone-200"
            >
              <img
                src={tile.img}
                alt={tile.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent" />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 text-stone-900 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                {tile.tag}
              </span>
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                  {tile.sub}
                </p>
                <h3 className="text-xl sm:text-2xl font-serif font-bold mt-1 flex items-center justify-between">
                  <span>{tile.title}</span>
                  <span className="text-amber-300 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Catalog Controls & Grid */}
      <main id="catalog" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 mb-8 shadow-sm space-y-4">
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
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                className="px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="featured">{t('sortFeatured')}</option>
                <option value="price-asc">{t('sortPriceLowHigh')}</option>
                <option value="price-desc">{t('sortPriceHighLow')}</option>
                <option value="rating">{t('sortRating')}</option>
              </select>

              <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-700 cursor-pointer select-none px-2 py-1">
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
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
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

      {/* Editorial Maison Story Section (Adopted from TheModelStudent/Parka About.tsx) */}
      <section
        id="about-maison"
        className="bg-white border-t border-stone-200 py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg border border-stone-200">
              <img
                src="/editorial/about-portrait.jpg"
                alt="Royal Rajasthani Miniature & Jadau Polki Craftsmanship"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-lg border border-stone-200 translate-y-6">
              <img
                src="/editorial/collection-heritage.jpg"
                alt="Heirloom Ruby & Emerald Kundan Necklace"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-rose-900">
              THE MAISON • JOHARI BAZAR, JAIPUR
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 leading-tight">
              {lang === 'hi'
                ? 'कला, विरासत और राजपूताना दस्तकारी का संगम'
                : 'Inspired by Royal Craft, Handloom & Heritage'}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              {lang === 'hi'
                ? 'ज़रिया जयपुर (Zariya Jaipur) में हर कुर्ती, पोटली और जड़ाऊ आभूषण पीढ़ियों से काम कर रहे उस्ताद कारीगरों द्वारा हाथ से तैयार किया जाता है। सांगानेरी हैंड-ब्लॉक मलमल से लेकर बीकानेरी कुंदन मीनाकारी तक, हर उत्पाद के साथ आपको तुरंत ईमेल पर आधिकारिक GST टैक्स इनवॉइस और गोपनीय ट्रैकिंग आईडी प्राप्त होती है।'
                : 'Zariya Jaipur is a contemporary Indian ethnic couture & heritage house rooted in Jaipur’s artisan guilds. From Sanganeri hand-block printed mulmul and Lucknowi Chikankari to Kutchi mirror-work bags and Bikaneri Jadau Polki, every creation is handcrafted slowly to be worn, loved, and passed on.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <p className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                  ✉️ Instant Email Receipt
                </p>
                <p className="text-xs text-stone-600 mt-1">
                  Automated HTML order confirmation & confidential Tracking ID emailed on payment.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <p className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                  🏛️ Official GST Invoice
                </p>
                <p className="text-xs text-stone-600 mt-1">
                  Downloadable A4 Tax Invoice with HSN codes, CGST/SGST or IGST & amount in words.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <p className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                  🔒 Private Tracking ID
                </p>
                <p className="text-xs text-stone-600 mt-1">
                  Un-guessable 12-hex token (`TRK-KC-...`) with PII masking for complete privacy.
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
