'use client';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { API_URL, Product, useT } from '../lib/store';

const CATS = ['all', 'kurti', 'bag', 'accessory'] as const;

export default function ShopPage() {
  const { t, lang } = useT();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [cat, setCat] = useState<(typeof CATS)[number]>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products))
      .catch(() => setError(true));
  }, []);

  // Catalog is small, so filtering happens in the browser for instant results.
  const shown = useMemo(() => {
    if (!products) return [];
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (!needle) return true;
      return p.name.toLowerCase().includes(needle) || (p.name_hi || '').includes(needle);
    });
  }, [products, cat, q]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          className="flex-1 border rounded-lg px-3 py-2 bg-white"
        />
        <div className="flex gap-2 overflow-x-auto">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap text-sm rounded-full px-4 py-2 border ${
                cat === c ? 'bg-brand text-white border-brand' : 'bg-white hover:bg-brand-light'
              }`}
            >
              {t(c)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-600">{t('errorGeneric')}</p>}
      {!products && !error && <p className="text-gray-500">{t('loading')}</p>}
      {products && shown.length === 0 && <p className="text-gray-500">{t('noProducts')}</p>}

      <div key={lang} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shown.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
