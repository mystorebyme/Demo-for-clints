'use client';
import Link from 'next/link';
import { rupees, useCart, useHydrated, useT } from '../../lib/store';

export default function CartPage() {
  const { t, lang } = useT();
  const hydrated = useHydrated();
  const { lines, setQty, remove } = useCart();

  if (!hydrated) return <p className="text-gray-500">{t('loading')}</p>;

  if (lines.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">{t('cartEmpty')}</p>
        <Link href="/" className="text-brand underline">
          {t('continueShopping')}
        </Link>
      </div>
    );
  }

  const total = lines.reduce((s, l) => s + l.price_paise * l.qty, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t('cart')}</h1>
      <div className="bg-white rounded-2xl border divide-y">
        {lines.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-3 p-4">
            <div className="flex-1">
              <p className="font-medium text-sm">{lang === 'hi' && l.name_hi ? l.name_hi : l.name}</p>
              <p className="text-brand text-sm font-bold">{rupees(l.price_paise)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(l.id, l.qty - 1)} className="w-8 h-8 border rounded-full" aria-label="decrease">
                −
              </button>
              <span className="w-6 text-center">{l.qty}</span>
              <button onClick={() => setQty(l.id, l.qty + 1)} className="w-8 h-8 border rounded-full" aria-label="increase">
                +
              </button>
            </div>
            <button onClick={() => remove(l.id)} className="text-xs text-red-600 underline">
              {t('remove')}
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 text-lg font-bold">
        <span>{t('total')}</span>
        <span>{rupees(total)}</span>
      </div>
      <Link href="/checkout" className="block mt-4 text-center bg-brand text-white rounded-xl py-3 hover:bg-brand-dark">
        {t('checkout')}
      </Link>
    </div>
  );
}
