'use client';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  API_URL,
  rupees,
  useCart,
  useHydrated,
  useT,
  validateCheckoutForm,
} from '../../lib/store';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CheckoutPage() {
  const { t, lang } = useT();
  const router = useRouter();
  const hydrated = useHydrated();
  const { lines, clear } = useCart();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Stable idempotency key per checkout form mount to prevent duplicate order creation
  const idempotencyKey = useMemo(
    () => `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    []
  );

  if (!hydrated) return <p className="text-gray-500 py-10 text-center">{t('loading')}</p>;

  if (lines.length === 0) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl border p-10 text-center space-y-4 my-8">
        <p className="text-gray-600 font-medium">{t('cartEmpty')}</p>
        <Link href="/" className="inline-block bg-brand text-white text-sm font-semibold px-6 py-3 rounded-xl">
          {t('continueShopping')}
        </Link>
      </div>
    );
  }

  const total = lines.reduce((s, l) => s + l.price_paise * l.qty, 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const fullAddress = [
      form.address.trim(),
      form.city.trim(),
      form.state.trim(),
      form.pincode.trim() ? `PIN: ${form.pincode.trim()}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const validation = validateCheckoutForm({
      name: form.name,
      phone: form.phone,
      address: fullAddress,
      pincode: form.pincode,
    });

    if (!validation.valid) {
      setError(validation.error || t('errorGeneric'));
      return;
    }

    setBusy(true);
    try {
      // Only product IDs and quantities are sent; server computes authoritative price from DB.
      const res = await fetch(`${API_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: fullAddress,
          },
          items: lines.map((l) => ({ id: l.id, qty: l.qty, size: l.size })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || data.message || t('errorGeneric'));
        setBusy(false);
        return;
      }

      if (data.paymentMode === 'mock') {
        clear();
        router.push(`/order/${data.orderId}?mock=1`);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setError(t('errorGeneric'));
        setBusy(false);
        return;
      }
      const rzp = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.amountPaise,
        currency: data.currency,
        order_id: data.gatewayOrderId,
        name: 'Kurti Corner',
        prefill: { name: form.name, contact: form.phone },
        // Browser callback is NOT trusted. Order is confirmed ONLY by signed server webhook.
        handler: () => {
          clear();
          router.push(`/order/${data.orderId}`);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch {
      setError(t('errorGeneric'));
      setBusy(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:border-brand focus:outline-none';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Delivery & Payment Form */}
      <form
        onSubmit={submit}
        className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-5 shadow-sm"
      >
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">{t('yourDetails')}</h1>

        <div className="space-y-1.5">
          <label htmlFor="checkout-name" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            {t('name')} *
          </label>
          <input
            id="checkout-name"
            className={inputClass}
            required
            minLength={2}
            maxLength={120}
            placeholder={t('namePlaceholder')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkout-phone" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            {t('phone')} *
          </label>
          <input
            id="checkout-phone"
            className={inputClass}
            required
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            placeholder={t('phonePlaceholder')}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
          />
          <p className="text-[11px] text-gray-500">{t('phoneHint')}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkout-address" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            {t('address')} *
          </label>
          <textarea
            id="checkout-address"
            className={inputClass}
            required
            minLength={10}
            maxLength={400}
            rows={3}
            placeholder={t('addressPlaceholder')}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="checkout-city" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              {t('city')}
            </label>
            <input
              id="checkout-city"
              className={inputClass}
              placeholder={t('cityPlaceholder')}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="checkout-state" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              {t('state')}
            </label>
            <input
              id="checkout-state"
              className={inputClass}
              placeholder={t('statePlaceholder')}
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="checkout-pincode" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              {t('pincode')}
            </label>
            <input
              id="checkout-pincode"
              className={inputClass}
              inputMode="numeric"
              pattern="[1-9][0-9]{5}"
              maxLength={6}
              placeholder={t('pincodePlaceholder')}
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
            />
          </div>
        </div>

        {/* Payment Method Box */}
        <div className="bg-pink-50/70 border border-pink-200 rounded-2xl p-4 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">{t('paymentMethod')}</p>
          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>⚡</span>
            <span>{t('paymentMethodQr')}</span>
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">{t('paymentMethodDesc')}</p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 font-medium">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-brand text-white font-bold text-sm rounded-xl py-3.5 hover:bg-brand-dark disabled:bg-gray-300 transition-colors shadow-sm"
        >
          {busy ? t('processing') : `${t('payNow')} (${rupees(total)})`}
        </button>
      </form>

      {/* Right: Order Summary Sidebar */}
      <aside className="lg:col-span-5 bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">{t('orderSummary')}</h2>
          <Link href="/cart" className="text-xs font-semibold text-brand hover:underline">
            {t('cart')} ({lines.reduce((n, l) => n + l.qty, 0)})
          </Link>
        </div>

        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-1">
          {lines.map((l) => {
            const title = lang === 'hi' && l.name_hi ? l.name_hi : l.name;
            const lineKey = l.lineKey || `${l.id}:${l.size}`;
            return (
              <div key={lineKey} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">
                    {t('size')}: {l.size} × {l.qty}
                  </p>
                </div>
                <span className="font-bold text-gray-900">{rupees(l.price_paise * l.qty)}</span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{t('subtotal')}</span>
            <span>{rupees(total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t('delivery')}</span>
            <span className="text-emerald-700 font-semibold">{t('deliveryFree')}</span>
          </div>
          <div className="flex justify-between text-lg font-extrabold text-gray-900 pt-2 border-t">
            <span>{t('total')}</span>
            <span className="text-brand">{rupees(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
