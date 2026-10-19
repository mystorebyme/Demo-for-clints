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
      size: p.sizes?.[0] || 'Free Size',
      image_url: p.image_url,
      category: p.category,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article
      data-testid={`product-card-${p.id}`}
      className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
    >
      <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
        <Link href={`/products/${p.id}`} className="block w-full h-full">
          <img
            src={p.image_url}
            alt={displayName}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {displayBadge && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-800 text-white shadow-sm">
              {displayBadge}
            </span>
          )}
          {discountPct > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-stone-950 shadow-sm w-fit">
              {discountPct}% OFF
            </span>
          )}
        </div>

        {/* Top Right Wishlist Heart Button */}
        <button
          type="button"
          onClick={() => toggleWishlist(p.id)}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90 ${
            isWishlisted
              ? 'bg-rose-600 text-white'
              : 'bg-white/90 hover:bg-white text-stone-600 hover:text-rose-600'
          }`}
        >
          {isWishlisted ? '♥' : '♡'}
        </button>

        {/* Stock Status Pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-900/90 text-white">
              {t('outOfStock')}
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-600/95 text-white">
              {t('lowStock', { count: p.stock })}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/90 text-emerald-800 backdrop-blur-sm">
              ● {t('inStock', { count: p.stock })}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="uppercase tracking-wider font-semibold text-rose-800">
              {p.category === 'kurti'
                ? t('categoryKurti')
                : p.category === 'bag'
                  ? t('categoryBag')
                  : t('categoryAccessory')}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
              ★ {p.rating.toFixed(1)} <span className="text-stone-400">({p.reviews_count})</span>
            </span>
          </div>

          <Link
            href={`/products/${p.id}`}
            className="block font-bold text-stone-900 text-base hover:text-rose-800 transition-colors line-clamp-1"
          >
            {displayName}
          </Link>

          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{displayDesc}</p>
        </div>

        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-stone-900">{rupees(p.price_paise)}</span>
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
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/products/${p.id}`}
              className="text-center py-2 px-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors"
            >
              {t('viewDetails')}
            </Link>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : justAdded
                    ? 'bg-emerald-700 text-white'
                    : 'bg-rose-800 hover:bg-rose-900 text-white'
              }`}
            >
              {isOutOfStock ? t('outOfStock') : justAdded ? `✓ ${t('addedToCart')}` : t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
