'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '../lib/catalog';
import { buildWhatsAppShareUrl, rupees, useStore } from '../lib/store';

export default function ProductCard({
  p,
}: {
  p: Product & { sold_count?: number };
}) {
  const { lang, addToCart, wishlist, toggleWishlist, t } = useStore();
  const [justAdded, setJustAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState(p.sizes?.[0] || 'Free Size');

  const displayName = lang === 'hi' && p.name_hi ? p.name_hi : p.name;
  const displayDesc = lang === 'hi' && p.description_hi ? p.description_hi : p.description;
  const displayBadge = lang === 'hi' && p.badge_hi ? p.badge_hi : p.badge;

  const isOutOfStock = p.stock <= 0;
  const isLowStock = p.stock > 0 && p.stock <= 5;
  const isWishlisted = wishlist.includes(p.id);

  const discountPct =
    p.original_price_paise && p.original_price_paise > p.price_paise
      ? Math.round(((p.original_price_paise - p.price_paise) / p.original_price_paise) * 100)
      : 0;

  const handleQuickAdd = () => {
    if (isOutOfStock) return;
    addToCart({
      id: p.id,
      name: p.name,
      name_hi: p.name_hi,
      price_paise: p.price_paise,
      qty: 1,
      size: selectedSize || p.sizes?.[0] || 'Free Size',
      image_url: p.image_url,
      category: p.category,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article
      data-testid={`product-card-${p.id}`}
      className="group bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
    >
      {/* Image Frame with Parka-style Dual-Image Hover Crossfade */}
      <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
        <Link href={`/products/${p.id}`} className="block w-full h-full relative">
          <img
            src={p.image_url}
            alt={displayName}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
              p.hover_image_url ? 'group-hover:opacity-0' : ''
            }`}
          />
          {p.hover_image_url && (
            <img
              src={p.hover_image_url}
              alt={`${displayName} alternate view`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        {/* Top Left Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
          {displayBadge && (
            <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-extrabold bg-rose-950/90 text-amber-200 backdrop-blur-sm shadow-sm">
              {displayBadge}
            </span>
          )}
          {discountPct > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-stone-950 shadow-sm w-fit">
              {discountPct}% OFF
            </span>
          )}
        </div>

        {/* Top Right Wishlist Heart Button */}
        <button
          type="button"
          onClick={() => toggleWishlist(p.id)}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 ${
            isWishlisted
              ? 'bg-rose-600 text-white'
              : 'bg-white/90 hover:bg-white text-stone-700 hover:text-rose-600 backdrop-blur-sm'
          }`}
        >
          {isWishlisted ? '♥' : '♡'}
        </button>

        {/* Stock Status Pill */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-900/90 text-white">
              {t('outOfStock')}
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-600/95 text-white">
              {t('lowStock', { count: p.stock })}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-emerald-900 backdrop-blur-sm shadow-sm">
              ● {t('inStock', { count: p.stock })}
            </span>
          )}
        </div>
      </div>

      {/* Editorial Product Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span className="uppercase tracking-widest text-[10px] font-extrabold text-rose-900">
              {p.category === 'kurti'
                ? t('categoryKurti')
                : p.category === 'bag'
                ? t('categoryBag')
                : t('categoryAccessory')}
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-700">
              ★ {p.rating.toFixed(1)}{' '}
              <span className="text-stone-400 font-normal">({p.reviews_count})</span>
            </span>
          </div>

          <Link
            href={`/products/${p.id}`}
            className="block font-serif font-bold text-stone-900 text-base sm:text-lg hover:text-rose-900 transition-colors line-clamp-1"
          >
            {displayName}
          </Link>

          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
            {displayDesc}
          </p>

          {/* Quick Size Selector Pills */}
          {p.sizes && p.sizes.length > 1 && (
            <div className="flex flex-wrap items-center gap-1 mt-2.5">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mr-1">
                Size:
              </span>
              {p.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                    selectedSize === sz
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-stone-100">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-extrabold text-stone-900">
                {rupees(p.price_paise)}
              </span>
              {p.original_price_paise && p.original_price_paise > p.price_paise && (
                <span className="text-xs text-stone-400 line-through">
                  {rupees(p.original_price_paise)}
                </span>
              )}
            </div>
            <a
              href={buildWhatsAppShareUrl(p)}
              target="_blank"
              rel="noopener noreferrer"
              title={t('shareOnWhatsApp')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/products/${p.id}`}
              className="text-center py-2.5 px-3 rounded-xl border border-stone-300 text-stone-800 hover:bg-stone-100 text-xs font-bold transition-colors"
            >
              {t('viewDetails')}
            </Link>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-colors shadow-sm ${
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
                ? `✓ ${t('addedToCart')}`
                : t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
