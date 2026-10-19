'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { API_URL, rupees, useT } from '../../../lib/store';

type Status = 'LOADING' | 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'FAILED' | 'NOT_FOUND';

export default function OrderPage({ params }: { params: { orderId: string } }) {
  const { t } = useT();
  const { orderId } = params;
  const [status, setStatus] = useState<Status>('LOADING');
  const [amount, setAmount] = useState<number | null>(null);
  const [mock, setMock] = useState(false);

  useEffect(() => {
    setMock(new URLSearchParams(window.location.search).get('mock') === '1');
  }, []);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/orders/${orderId}`);
        if (res.status === 404) return !stop && setStatus('NOT_FOUND');
        const d = await res.json();
        if (stop || !d.success) return;
        setStatus(d.status);
        setAmount(d.amountPaise);
      } catch {
        /* keep polling */
      }
    }
    load();

    // Real-time push from the server, plus polling as a safety net.
    const socket = io(API_URL);
    socket.on('connect', () => socket.emit('join', orderId));
    socket.on('payment_confirmed', () => load());
    socket.on('order_expired', () => load());
    const poll = setInterval(load, 3000);

    return () => {
      stop = true;
      clearInterval(poll);
      socket.disconnect();
    };
  }, [orderId]);

  async function simulate() {
    await fetch(`${API_URL}/api/dev/mock-pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
  }

  const box = 'p-4 rounded-xl font-semibold';

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border shadow-sm p-6 text-center space-y-4">
      <h1 className="text-xl font-bold">{t('orderId')}</h1>
      <p className="font-mono text-sm text-gray-500 break-all">{orderId}</p>
      {amount !== null && <p className="text-lg font-bold">{rupees(amount)}</p>}

      {status === 'LOADING' && <p className="text-gray-400 animate-pulse">{t('loading')}</p>}
      {status === 'PENDING' && (
        <div className={`${box} bg-yellow-50 text-yellow-700`}>⏳ {t('waitingPayment')}</div>
      )}
      {status === 'CONFIRMED' && <div className={`${box} bg-green-100 text-green-700`}>✅ {t('confirmed')}</div>}
      {status === 'EXPIRED' && <div className={`${box} bg-gray-100 text-gray-700`}>⌛ {t('expired')}</div>}
      {(status === 'FAILED' || status === 'NOT_FOUND') && (
        <div className={`${box} bg-red-50 text-red-700`}>⚠️ {t('failed')}</div>
      )}

      {mock && status === 'PENDING' && (
        <button onClick={simulate} className="w-full border-2 border-dashed border-brand text-brand rounded-xl py-2">
          {t('simulate')}
        </button>
      )}

      <Link href="/" className="block text-brand underline text-sm">
        {t('continueShopping')}
      </Link>
    </div>
  );
}
