'use client';
import { useState } from 'react';
import { Product, rupees, useCart, useT } from '../lib/store';

const EMOJI: Record<string, string> = { kurti: '👗', bag: '👜', accessory: '💍' };

export default function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useT();
  const add = useCart((s) => s.add);
  const [imgOk, setImgOk] = useState(true);
  const title = lang === 'hi' && product.name_hi ? product.name_hi : product.name;

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
      <div className="aspect-square bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={title}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl">{EMOJI[product.category]}</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-medium leading-snug">{title}</h3>
        <p className="text-brand font-bold">{rupees(product.price_paise)}</p>
        <button
          disabled={product.stock === 0}
          onClick={() => add(product)}
          className="mt-auto bg-brand text-white text-sm rounded-lg py-2 hover:bg-brand-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? t('outOfStock') : t('addToCart')}
        </button>
      </div>
    </div>
  );
}
