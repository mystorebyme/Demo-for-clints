'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { DEMO_PRODUCTS, Product } from '../../lib/catalog';
import { useStore } from '../../lib/store';

export default function WishlistPage() {
  const { wishlist, lang, t } = useStore();
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.products) && d.products.length > 0) {
          setProducts(d.products);
        }
      })
      .catch(() => {});
  }, []);

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-center gap-2">
              <span className="text-rose-600">♥</span> {t('wishlistTitle')}
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              {lang === 'hi'
                ? `${wishlistedProducts.length} पसंदीदा आइटम सेव किए गए हैं`
                : `${wishlistedProducts.length} saved items in your personal boutique list`}
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-sm font-semibold text-stone-700"
          >
            ← {t('continueShopping')}
          </Link>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-sm max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-rose-700 flex items-center justify-center text-3xl mb-4">
              ♡
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">{t('wishlistTitle')}</h2>
            <p className="text-sm text-stone-500 mb-6">{t('wishlistEmpty')}</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              {t('shopNow')} →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistedProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
