'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Product, rupees, useCart, useT } from '../lib/store';

const EMOJI: Record<string, string> = { kurti: '👗', bag: '👜', accessory: '💍' };

export default function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useT();
  const add = useCart((s) => s.add);
  const [imgOk, setImgOk] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>(
    (product.sizes && product.sizes[0]) || (product.category === 'kurti' ? 'M' : 'Free Size')
  );
  const [justAdded, setJustAdded] = useState(false);

  const title = lang === 'hi' && product.name_hi ? product.name_hi : product.name;
  const material =
    lang === 'hi' && product.fabric_or_material_hi
      ? product.fabric_or_material_hi
      : product.fabric_or_material;

  const imgSrc = (product.image_url || '').replace(/\.webp$/i, '.svg');
  const sizes = product.sizes || (product.category === 'kurti' ? ['S', 'M', 'L', 'XL'] : ['Free Size']);

  const handleAdd = () => {
    if (product.stock <= 0) return;
    add(product, 1, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-square bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center overflow-hidden group"
      >
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-6xl" role="img" aria-label={product.category}>
            {EMOJI[product.category] || '🛍️'}
          </span>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          <span className="bg-white/90 backdrop-blur text-gray-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">
            {t(product.category)}
          </span>
          {product.stock === 0 ? (
            <span className="bg-red-600 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {t('outOfStock')}
            </span>
          ) : product.stock <= 10 ? (
            <span className="bg-amber-500 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {t('lowStock', { count: product.stock })}
            </span>
          ) : (
            <span className="bg-emerald-600/90 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              {t('inStock')}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${product.id}`} className="hover:text-brand transition-colors">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2">
              {title}
            </h3>
          </Link>
        </div>

        {material && (
          <p className="text-xs text-gray-500 line-clamp-1">{material}</p>
        )}

        <div className="flex items-baseline justify-between pt-1">
          <p className="text-lg font-extrabold text-brand">{rupees(product.price_paise)}</p>
          <Link
            href={`/products/${product.id}`}
            className="text-xs font-medium text-gray-500 hover:text-brand underline"
          >
            {t('viewDetails')}
          </Link>
        </div>

        {/* Quick Size Selector if multiple sizes exist */}
        {sizes.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1 flex-wrap" role="group" aria-label={t('selectSize')}>
            {sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                  selectedSize === sz
                    ? 'bg-brand text-white border-brand'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-brand'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={product.stock === 0}
          onClick={handleAdd}
          className={`mt-auto w-full text-sm font-semibold rounded-xl py-2.5 px-3 transition-colors ${
            product.stock === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : justAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-brand text-white hover:bg-brand-dark'
          }`}
        >
          {product.stock === 0 ? t('outOfStock') : justAdded ? t('addedToCart') : t('addToCart')}
        </button>
      </div>
    </article>
  );
}
