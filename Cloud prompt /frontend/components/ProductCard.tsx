'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProductPriceForSize, Product } from '../lib/catalog';
import { buildWhatsAppShareUrl, rupees, useStore } from '../lib/store';

const BUST_SIZE_MAP: Record<string, string> = {
  XS: 'XS [34]',
  S: 'S [36]',
  M: 'M [38]',
  L: 'L [40]',
  XL: 'XL [42]',
  XXL: 'XXL [44]',
  '2XL': '2XL [44]',
  '3XL': '3XL [46]',
};

export function formatEthnicSizeLabel(size: string, category?: string): string {
  if (category === 'kurti' && BUST_SIZE_MAP[size]) {
    return BUST_SIZE_MAP[size];
  }
  return size;
}

export function extractProductShade(name: string): { label: string; hex: string } {
  const lower = (name || '').toLowerCase();
  if (lower.includes('sindoor') || lower.includes('crimson') || lower.includes('maroon')) {
    return { label: 'Sindoor Crimson', hex: '#7f1d1d' };
  }
  if (lower.includes('gulab') || lower.includes('rose') || lower.includes('pink') || lower.includes('pastel')) {
    return { label: 'Dusty Rose', hex: '#be185d' };
  }
  if (lower.includes('chandan') || lower.includes('ivory') || lower.includes('cream')) {
    return { label: 'Ivory Cream', hex: '#f5f0e1' };
  }
  if (lower.includes('mehndi') || lower.includes('olive')) {
    return { label: 'Mehndi Green', hex: '#3f6212' };
  }
  if (lower.includes('haldi') || lower.includes('marigold') || lower.includes('gold') || lower.includes('mustard')) {
    return { label: 'Haldi Mustard', hex: '#ca8a04' };
  }
  if (lower.includes('kesar') || lower.includes('saffron') || lower.includes('coral')) {
    return { label: 'Saffron Coral', hex: '#ea580c' };
  }
  if (lower.includes('firoza') || lower.includes('turquoise')) {
    return { label: 'Firoza Blue', hex: '#0284c7' };
  }
  if (lower.includes('peacock') || lower.includes('emerald')) {
    return { label: 'Peacock Emerald', hex: '#047857' };
  }
  if (lower.includes('neel') || lower.includes('indigo') || lower.includes('midnight')) {
    return { label: 'Midnight Indigo', hex: '#1e3a8a' };
  }
  if (lower.includes('jamuni') || lower.includes('plum') || lower.includes('velvet')) {
    return { label: 'Royal Plum', hex: '#581c87' };
  }
  return { label: 'Jaipur Heritage', hex: '#881337' };
}

export default function ProductCard({
  p,
}: {
  p: Product & { sold_count?: number };
}) {
  const router = useRouter();
  const { lang, addToCart, wishlist, toggleWishlist, compareList, toggleCompare, t } = useStore();
  const [justAdded, setJustAdded] = useState(false);
  const [showAltImage, setShowAltImage] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickQty, setQuickQty] = useState(1);

  const defaultSize = p.sizes?.includes('M') ? 'M' : p.sizes?.[0] || 'Free Size';
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [quickImage, setQuickImage] = useState(p.image_url);

  const displayName = lang === 'hi' && p.name_hi ? p.name_hi : p.name;
  const displayDesc = lang === 'hi' && p.description_hi ? p.description_hi : p.description;
  const displayBadge = lang === 'hi' && p.badge_hi ? p.badge_hi : p.badge;

  const isOutOfStock = p.stock <= 0;
  const isLowStock = p.stock > 0 && p.stock <= 5;
  const isWishlisted = wishlist.includes(p.id);
  const isCompared = compareList.includes(p.id);

  // Dynamically compute price & MRP based on selected size
  const activeQuote = getProductPriceForSize(p, selectedSize);
  const activePricePaise = activeQuote.price_paise;
  const activeOriginalPaise = activeQuote.original_price_paise;

  const discountPct =
    activeOriginalPaise && activeOriginalPaise > activePricePaise
      ? Math.round(((activeOriginalPaise - activePricePaise) / activeOriginalPaise) * 100)
      : 0;

  const secondaryImage =
    p.hover_image_url ||
    (Array.isArray(p.gallery) && p.gallery.length > 1 ? p.gallery[1] : undefined);

  const galleryList =
    Array.isArray(p.gallery) && p.gallery.length > 0
      ? p.gallery
      : ([p.image_url, secondaryImage].filter(Boolean) as string[]);

  const shade = extractProductShade(p.name);

  const handleQuickAdd = (qtyToAdd = 1) => {
    if (isOutOfStock) return;
    addToCart({
      id: p.id,
      name: p.name,
      name_hi: p.name_hi,
      price_paise: activePricePaise,
      qty: qtyToAdd,
      size: activeQuote.size,
      image_url: p.image_url,
      category: p.category,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleBuyItNow = () => {
    if (isOutOfStock) return;
    addToCart({
      id: p.id,
      name: p.name,
      name_hi: p.name_hi,
      price_paise: activePricePaise,
      qty: quickQty,
      size: activeQuote.size,
      image_url: p.image_url,
      category: p.category,
    });
    setShowQuickView(false);
    router.push('/checkout');
  };

  return (
    <>
      <article
        data-testid={`product-card-${p.id}`}
        className="group bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
      >
        {/* Studio Image Frame with Dual-Image Hover Crossfade */}
        <div className="relative aspect-[3/4] sm:aspect-[4/5] bg-stone-100 overflow-hidden">
          <Link href={`/products/${p.id}`} className="block w-full h-full relative">
            <img
              src={showAltImage && secondaryImage ? secondaryImage : p.image_url}
              alt={displayName}
              loading="lazy"
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
                secondaryImage && !showAltImage ? 'sm:group-hover:opacity-0' : ''
              }`}
            />
            {secondaryImage && (
              <img
                src={secondaryImage}
                alt={`${displayName} detail view`}
                loading="lazy"
                className="hidden sm:block absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>

          {/* Top Left Badges: -XX% Discount Pill + Sold Out / Pre-Order + Editorial Badge */}
          <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 flex flex-col gap-1 z-10">
            {discountPct > 0 && (
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-extrabold bg-rose-900 text-amber-200 shadow-sm w-fit tracking-wide">
                -{discountPct}%
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold bg-stone-900 text-amber-300 shadow-sm w-fit">
                Pre-Order
              </span>
            )}
            {displayBadge && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold bg-stone-950/85 text-white backdrop-blur-sm shadow-sm w-fit">
                {displayBadge}
              </span>
            )}
          </div>

          {/* Top Right Action Stack: Wishlist + Compare + Quick View (Inspired by Liksha Clothing) */}
          <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-10 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => toggleWishlist(p.id)}
              aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 ${
                isWishlisted
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 backdrop-blur-sm'
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={isWishlisted ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => toggleCompare(p.id)}
              aria-label={isCompared ? 'Remove from Compare' : 'Compare Product'}
              title={isCompared ? 'Added to Compare' : 'Compare Product'}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 text-[10px] font-extrabold ${
                isCompared
                  ? 'bg-stone-950 text-amber-300 border border-amber-400'
                  : 'bg-white/90 hover:bg-white text-stone-700 hover:text-stone-950 backdrop-blur-sm'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuickImage(p.image_url);
                setShowQuickView(true);
              }}
              aria-label="Quick View"
              title="Quick View / Quick Shop"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-stone-950 text-stone-700 hover:text-amber-300 flex items-center justify-center shadow-md backdrop-blur-sm transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* Bottom Overlay: Rating + Mobile Image Flip + Stock Pill */}
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 z-10 flex items-center justify-between gap-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-white/95 text-stone-900 shadow-sm">
              {p.rating.toFixed(1)} / 5 <span className="text-stone-400 font-normal">({p.reviews_count})</span>
            </span>
            <div className="flex items-center gap-1">
              {secondaryImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAltImage((v) => !v);
                  }}
                  className="sm:hidden px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-stone-950/80 text-amber-200"
                >
                  {showAltImage ? '1/2' : '2/2'}
                </button>
              )}
              {isOutOfStock ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-900/90 text-white">
                  {t('outOfStock')}
                </span>
              ) : isLowStock ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-600/95 text-white">
                  Only {p.stock} left
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Product Info (Compact on Mobile, Spacious on Desktop) */}
        <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
          <div>
            <div className="flex items-center justify-between text-[10px] text-stone-500 mb-0.5 sm:mb-1">
              <span className="uppercase tracking-widest font-extrabold text-rose-900 truncate">
                {p.category === 'kurti'
                  ? t('categoryKurti')
                  : p.category === 'bag'
                  ? t('categoryBag')
                  : t('categoryAccessory')}
              </span>
              {/* Color Swatch Pill (Liksha Clothing Pattern) */}
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-stone-600">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0"
                  style={{ backgroundColor: shade.hex }}
                />
                <span className="hidden sm:inline truncate max-w-[90px]">{shade.label}</span>
              </span>
            </div>

            <Link
              href={`/products/${p.id}`}
              className="block font-serif font-bold text-stone-900 text-xs sm:text-base hover:text-rose-900 transition-colors line-clamp-1"
            >
              {displayName}
            </Link>

            <p className="hidden sm:line-clamp-2 text-xs text-stone-500 mt-1 leading-relaxed">
              {displayDesc}
            </p>

            {/* Quick Size Selector Pills with Bust Measurements (S [36]..XXL [44]) & Size-Dynamic Pricing */}
            {p.sizes && p.sizes.length > 1 && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5 sm:mt-2.5">
                {p.sizes.map((sz) => {
                  const szPrice = getProductPriceForSize(p, sz).price_paise;
                  const label = formatEthnicSizeLabel(sz, p.category);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      title={`${label}: ${rupees(szPrice)}`}
                      className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border transition ${
                        selectedSize === sz
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 sm:pt-3 border-t border-stone-100">
            <div className="flex items-baseline justify-between mb-2 sm:mb-3">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm sm:text-xl font-extrabold text-stone-900">
                  {rupees(activePricePaise)}
                </span>
                {activeOriginalPaise && activeOriginalPaise > activePricePaise && (
                  <span className="text-[10px] sm:text-xs text-stone-400 line-through">
                    {rupees(activeOriginalPaise)}
                  </span>
                )}
                {p.sizes && p.sizes.length > 1 && (
                  <span className="text-[9px] sm:text-[10px] font-mono font-semibold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {formatEthnicSizeLabel(selectedSize, p.category)}
                  </span>
                )}
              </div>
              <a
                href={buildWhatsAppShareUrl(p)}
                target="_blank"
                rel="noopener noreferrer"
                title={t('shareOnWhatsApp')}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition"
              >
                <span>Share</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuickImage(p.image_url);
                  setShowQuickView(true);
                }}
                className="hidden sm:block text-center py-2.5 px-3 rounded-xl border border-stone-300 text-stone-800 hover:bg-stone-100 text-xs font-bold transition-colors"
              >
                Quick Shop
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => handleQuickAdd(1)}
                className={`w-full py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition-colors shadow-sm ${
                  isOutOfStock
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    : justAdded
                    ? 'bg-emerald-700 text-white'
                    : 'bg-rose-900 hover:bg-rose-950 text-white'
                }`}
              >
                {isOutOfStock
                  ? 'Sold Out / Pre-Order'
                  : justAdded
                  ? t('addedToCart')
                  : `+ ${t('addToCart')}`}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Liksha-Style Quick View & Quick Shop Modal */}
      {showQuickView && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setShowQuickView(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-stone-200 grid grid-cols-1 md:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Always-Visible Floating Top-Right Cross (×) Button */}
            <button
              type="button"
              onClick={() => setShowQuickView(false)}
              aria-label="Close Quick View"
              title="Close"
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-stone-950 text-white hover:bg-rose-900 flex items-center justify-center text-lg font-bold shadow-lg transition"
            >
              ×
            </button>

            {/* Left Gallery */}
            <div className="md:col-span-5 bg-stone-100 p-4 flex flex-col justify-between">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-stone-200">
                <img
                  src={quickImage || p.image_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
                {discountPct > 0 && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-900 text-amber-200">
                    -{discountPct}%
                  </span>
                )}
              </div>
              {galleryList.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto">
                  {galleryList.map((img, i) => (
                    <button
                      key={`qv-${img}-${i}`}
                      type="button"
                      onClick={() => setQuickImage(img)}
                      className={`w-14 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                        (quickImage || p.image_url) === img
                          ? 'border-rose-900'
                          : 'border-stone-200 opacity-70'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Quick Shop Details */}
            <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 pr-10">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-900 font-bold">
                    SKU: {p.sku} | {shade.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuickView(false)}
                    className="px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                  >
                    × Close
                  </button>
                </div>

                <h3 className="text-lg sm:text-2xl font-serif font-bold text-stone-900">
                  {displayName}
                </h3>

                <div className="flex items-baseline gap-2.5 mt-2 flex-wrap">
                  <span className="text-2xl font-extrabold text-rose-900">
                    {rupees(activePricePaise)}
                  </span>
                  {activeOriginalPaise && activeOriginalPaise > activePricePaise && (
                    <span className="text-sm text-stone-400 line-through">
                      {rupees(activeOriginalPaise)}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Shipping & GST Included
                  </span>
                </div>

                {/* Liksha 3-Pill Guarantee Strip */}
                <div className="grid grid-cols-3 gap-2 my-3.5 text-[10px] font-bold text-stone-700">
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
                    Express Delivery on Prepaid Orders
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
                    4–7 Days Delivery Time
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
                    100% Premium Fabric Guarantee
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-4">{displayDesc}</p>

                {/* Size Selector */}
                <div className="mb-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Size: {formatEthnicSizeLabel(selectedSize, p.category)}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {p.sizes.map((sz) => {
                      const szQuote = getProductPriceForSize(p, sz);
                      const lbl = formatEthnicSizeLabel(sz, p.category);
                      return (
                        <button
                          key={`qv-sz-${sz}`}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex flex-col items-center ${
                            selectedSize === sz
                              ? 'bg-stone-950 text-amber-300 border-stone-950'
                              : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900'
                          }`}
                        >
                          <span>{lbl}</span>
                          <span className="text-[10px] font-mono opacity-80">
                            {rupees(szQuote.price_paise)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center rounded-xl border border-stone-300 bg-white">
                    <button
                      type="button"
                      onClick={() => setQuickQty((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-stone-700 font-bold"
                    >
                      −
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold">{quickQty}</span>
                    <button
                      type="button"
                      onClick={() => setQuickQty((q) => Math.min(10, q + 1))}
                      className="px-3 py-1.5 text-stone-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700">
                    {isOutOfStock ? 'Out of Stock — Pre-Order Inquiry Open' : `${p.stock} pieces ready in Jaipur Atelier`}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleQuickAdd(quickQty)}
                    className="py-3 px-4 rounded-xl border border-rose-900 text-rose-900 hover:bg-rose-50 font-extrabold text-xs uppercase tracking-wider disabled:opacity-40"
                  >
                    {justAdded ? t('addedToCart') : t('addToCart')}
                  </button>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyItNow}
                    className="py-3 px-4 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-extrabold text-xs uppercase tracking-wider disabled:opacity-40"
                  >
                    Buy It Now →
                  </button>
                </div>
                <Link
                  href={`/products/${p.id}`}
                  onClick={() => setShowQuickView(false)}
                  className="block text-center py-2 text-xs font-bold text-stone-600 hover:text-rose-900 underline"
                >
                  Open Full Product Page, Specifications & Reviews →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
