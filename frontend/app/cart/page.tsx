'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL, rupees, useCart, useHydrated, useT } from '../../lib/store';

export default function CartPage() {
  const { t, lang } = useT();
  const hydrated = useHydrated();
  const { lines, setQty, remove, clear, syncServerPrices } = useCart();

  const [serverTotalPaise, setServerTotalPaise] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!hydrated || lines.length === 0) {
      setServerTotalPaise(null);
      setWarnings([]);
      return;
    }
    let cancelled = false;
    async function validateWithServer() {
      setValidating(true);
      try {
        const res = await fetch(`${API_URL}/api/cart/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: lines.map((l) => ({ id: l.id, qty: l.qty, size: l.size })),
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success) {
          setServerTotalPaise(data.totalPaise);
          setWarnings(data.warnings || []);
          if (Array.isArray(data.items)) {
            syncServerPrices(data.items);
          }
        }
      } catch {
        // Fallback to local calculation if offline
      } finally {
        if (!cancelled) setValidating(false);
      }
    }
    validateWithServer();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, lines.map((l) => `${l.id}:${l.size}:${l.qty}`).join(',')]);

  if (!hydrated) {
    return <p className="text-gray-500 py-10 text-center">{t('loading')}</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-4 my-8 shadow-sm">
        <div className="text-5xl" aria-hidden="true">🛒</div>
        <h1 className="text-xl font-bold text-gray-900">{t('cartEmpty')}</h1>
        <p className="text-sm text-gray-500">{t('cartEmptySub')}</p>
        <Link
          href="/"
          className="inline-block bg-brand text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
        >
          {t('continueShopping')} →
        </Link>
      </div>
    );
  }

  const clientTotal = lines.reduce((s, l) => s + l.price_paise * l.qty, 0);
  const displayTotal = serverTotalPaise ?? clientTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{t('cart')}</h1>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold text-red-600 hover:underline"
        >
          {t('clearCart')}
        </button>
      </div>

      {warnings.length > 0 && (
        <div role="alert" className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
          {warnings.map((w, idx) => (
            <p key={idx}>⚠️ {w}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
          {lines.map((l) => {
            const title = lang === 'hi' && l.name_hi ? l.name_hi : l.name;
            const imgSrc = (l.image_url || '/products/kurti1.svg').replace(/\.webp$/i, '.svg');
            const lineKey = l.lineKey || `${l.id}:${l.size || 'Free Size'}`;
            const cap = Math.min(10, l.maxStock ?? 10);

            return (
              <div key={lineKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3.5 flex-1">
                  <Link href={`/products/${l.id}`} className="w-16 h-16 rounded-xl overflow-hidden border bg-pink-50 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
                  </Link>
                  <div className="space-y-1">
                    <Link href={`/products/${l.id}`} className="font-bold text-sm sm:text-base text-gray-900 hover:text-brand">
                      {title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {l.size && (
                        <span className="bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded">
                          {t('size')}: {l.size}
                        </span>
                      )}
                      <span>
                        {t('unitPrice')}: <strong className="text-gray-800">{rupees(l.price_paise)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="inline-flex items-center border border-gray-300 rounded-xl bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setQty(l.id, l.qty - 1, l.size)}
                      className="w-8 h-8 font-bold text-gray-700 hover:bg-gray-200 rounded-l-xl"
                      aria-label={`Decrease quantity for ${title}`}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold" aria-live="polite">
                      {l.qty}
                    </span>
                    <button
                      type="button"
                      disabled={l.qty >= cap}
                      onClick={() => setQty(l.id, l.qty + 1, l.size)}
                      className="w-8 h-8 font-bold text-gray-700 hover:bg-gray-200 rounded-r-xl disabled:opacity-40"
                      aria-label={`Increase quantity for ${title}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[72px]">
                    <p className="font-extrabold text-brand text-sm sm:text-base">
                      {rupees(l.price_paise * l.qty)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(l.id, l.size)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                    aria-label={`${t('remove')} ${title}`}
                  >
                    {t('remove')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-bold text-lg text-gray-900">{t('orderSummary')}</h2>

          <div className="space-y-2 text-sm border-b border-gray-100 pb-4">
            <div className="flex justify-between text-gray-600">
              <span>{t('subtotal')}</span>
              <span className="font-semibold text-gray-900">{rupees(displayTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t('delivery')}</span>
              <span className="font-semibold text-emerald-700">{t('deliveryFree')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-lg font-extrabold text-gray-900">
            <span>{t('total')}</span>
            <span className="text-brand">{rupees(displayTotal)}</span>
          </div>

          <div className="text-xs flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 font-medium">
            <span>✓</span>
            <span>{validating ? t('validatingCart') : t('serverValidated')}</span>
          </div>

          <Link
            href="/checkout"
            className="block w-full text-center bg-brand text-white font-bold text-sm rounded-xl py-3.5 hover:bg-brand-dark transition-colors shadow-sm"
          >
            {t('checkout')} →
          </Link>

          <Link
            href="/"
            className="block w-full text-center text-xs font-semibold text-gray-600 hover:text-brand underline pt-1"
          >
            ← {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
