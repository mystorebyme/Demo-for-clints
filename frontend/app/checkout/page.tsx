'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL, rupees, useCart, useHydrated, useT } from '../../lib/store';

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
  const { t } = useT();
  const router = useRouter();
  const hydrated = useHydrated();
  const { lines, clear } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!hydrated) return <p className="text-gray-500">{t('loading')}</p>;
  if (lines.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">{t('cartEmpty')}</p>
        <Link href="/" className="text-brand underline">{t('continueShopping')}</Link>
      </div>
    );
  }

  const total = lines.reduce((s, l) => s + l.price_paise * l.qty, 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Only product ids and quantities are sent. The server computes the price itself.
      const res = await fetch(`${API_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form,
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
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
        // The browser callback is NOT trusted. The order is confirmed only by the server webhook.
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

  const input = 'w-full border rounded-lg px-3 py-2 bg-white';

  return (
    <form onSubmit={submit} className="max-w-md mx-auto bg-white rounded-2xl border p-6 space-y-4">
      <h1 className="text-xl font-bold">{t('yourDetails')}</h1>
      <input className={input} required minLength={2} placeholder={t('name')} value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={input} required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder={t('phone')}
        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
      <textarea className={input} required minLength={10} rows={3} placeholder={t('address')} value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <div className="flex justify-between font-bold text-lg">
        <span>{t('total')}</span>
        <span>{rupees(total)}</span>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button disabled={busy} className="w-full bg-brand text-white rounded-xl py-3 hover:bg-brand-dark disabled:bg-gray-300">
        {busy ? t('processing') : t('payNow')}
      </button>
    </form>
  );
}
