'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
};

export function formatEthnicSizeLabel(size: string, category?: string): string {
  if (category === 'kurti' && BUST_SIZE_MAP[size]) {
    return BUST_SIZE_MAP[size];
  }
  return size;
}

export default function ProductCard({
  p,
}: {
  p: Product & { sold_count?: number };
}) {
  const { lang, addToCart, wishlist, toggleWishlist, t } = useStore();
  const [justAdded, setJustAdded] = useState(false);
  const [showAltImage, setShowAltImage] = useState(false);
  const defaultSize = p.sizes?.includes('M') ? 'M' : p.sizes?.[0] || 'Free Size';
  const [selectedSize, setSelectedSize] = useState(defaultSize);

  const displayName = lang === 'hi' && p.name_hi ? p.name_hi : p.name;
  const displayDesc = lang === 'hi' && p.description_hi ? p.description_hi : p.description;
  const displayBadge = lang === 'hi' && p.badge_hi ? p.badge_hi : p.badge;

  const isOutOfStock = p.stock <= 0;
  const isLowStock = p.stock > 0 && p.stock <= 5;
  const isWishlisted = wishlist.includes(p.id);

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

  const handleQuickAdd = () => {
    if (isOutOfStock) return;
    addToCart({
      id: p.id,
      name: p.name,
      name_hi: p.name_hi,
      price_paise: activePricePaise,
      qty: 1,
      size: activeQuote.size,
      image_url: p.image_url,
      category: p.category,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
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
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        {/* Top Left Badges: Bufani-style -XX% Discount Pill + Editorial Badge */}
        <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 flex flex-col gap-1 z-10">
          {discountPct > 0 && (
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-extrabold bg-rose-900 text-amber-200 shadow-sm w-fit tracking-wide">
              -{discountPct}%
            </span>
          )}
          {displayBadge && (
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold bg-stone-950/85 text-white backdrop-blur-sm shadow-sm w-fit">
              {displayBadge}
            </span>
          )}
        </div>

        {/* Top Right Wishlist Heart Button */}
        <button
          type="button"
          onClick={() => toggleWishlist(p.id)}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 ${
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
            <span className="hidden sm:inline font-mono text-[10px] text-stone-400">{p.sku}</span>
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
            <Link
              href={`/products/${p.id}`}
              className="hidden sm:block text-center py-2.5 px-3 rounded-xl border border-stone-300 text-stone-800 hover:bg-stone-100 text-xs font-bold transition-colors"
            >
              {t('viewDetails')}
            </Link>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className={`w-full py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-extrabold transition-colors shadow-sm ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : justAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-rose-900 hover:bg-rose-950 text-white'
              }`}
            >
              {isOutOfStock
                ? t('outOfStock')
                : justAdded
                ? t('addedToCart')
                : `+ ${t('addToCart')}`}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
