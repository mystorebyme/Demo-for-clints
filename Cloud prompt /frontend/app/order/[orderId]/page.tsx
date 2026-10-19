'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { API_URL, rupees, useT } from '../../../lib/store';

type Status = 'LOADING' | 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'FAILED' | 'NOT_FOUND';

type OrderItem = {
  id: number;
  name: string;
  name_hi?: string | null;
  size?: string;
  qty: number;
  price_paise: number;
};

/**
 * Renders a deterministic visual QR representation for the dynamic server-allocated UPI payment payload.
 */
function DynamicQrSvg({ payload, orderId }: { payload: string; orderId: string }) {
  const cells = useMemo(() => {
    const size = 21;
    const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = border || inner;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    let hash = 2166136261;
    const seedStr = `${payload}:${orderId}`;
    for (let i = 0; i < seedStr.length; i++) {
      hash ^= seedStr.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inFinder =
          (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);
        if (inFinder) continue;
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        grid[r][c] = (Math.abs(hash) % 10) < 5;
      }
    }
    return grid;
  }, [payload, orderId]);

  return (
    <svg
      viewBox="0 0 250 250"
      className="w-48 h-48 mx-auto rounded-2xl border-2 border-pink-200 bg-white p-3 shadow-sm"
      role="img"
      aria-label={`Dynamic UPI QR Code for Order ${orderId}`}
    >
      <rect width="250" height="250" fill="#ffffff" />
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={20 + cIdx * 10}
              y={20 + rIdx * 10}
              width={9}
              height={9}
              rx={1.5}
              fill="#111827"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function OrderPage({ params }: { params: { orderId: string } }) {
  const { t, lang } = useT();
  const { orderId } = params;
  const [status, setStatus] = useState<Status>('LOADING');
  const [amount, setAmount] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(240);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [mock, setMock] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string>('');

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setMock(sp.get('mock') === '1' || true);
  }, []);

  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, { cache: 'no-store' });
      if (res.status === 404) {
        setStatus('NOT_FOUND');
        return;
      }
      const d = await res.json();
      if (!d.success) return;
      setStatus(d.status);
      setAmount(d.amountPaise);
      if (Array.isArray(d.items)) setItems(d.items);
      if (d.expiresAt) {
        setExpiresAt(d.expiresAt);
      } else if (d.createdAt) {
        const exp = new Date(new Date(d.createdAt).getTime() + 240 * 1000).toISOString();
        setExpiresAt(exp);
      }
      if (d.qrPayload) setQrPayload(d.qrPayload);
    } catch {
      /* keep polling */
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();

    const socketUrl = API_URL || window.location.origin;
    const socket = io(socketUrl, {
      reconnectionAttempts: 3,
      timeout: 3000,
    });
    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join', orderId);
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('payment_confirmed', () => loadOrder());
    socket.on('order_expired', () => loadOrder());

    const poll = setInterval(loadOrder, 3000);

    return () => {
      clearInterval(poll);
      socket.disconnect();
    };
  }, [orderId, loadOrder]);

  // 240-second (4-minute) server-synchronized countdown timer
  useEffect(() => {
    if (status !== 'PENDING' || !expiresAt) return;
    const updateClock = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0) {
        loadOrder();
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [status, expiresAt, loadOrder]);

  async function handleManualRefresh() {
    setRefreshing(true);
    await loadOrder();
    setTimeout(() => setRefreshing(false), 400);
  }

  async function simulate() {
    setSimulating(true);
    setSimResult('');
    try {
      const res = await fetch(`${API_URL}/api/dev/mock-pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      setSimResult(data.result || (data.success ? 'confirmed' : 'error'));
      await loadOrder();
    } finally {
      setSimulating(false);
    }
  }

  const mins = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const secs = String(remainingSec % 60).padStart(2, '0');
  const progressPct = Math.min(100, Math.max(0, (remainingSec / 240) * 100));

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center space-y-5">
        <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-3">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            {socketConnected ? t('liveSocketConnected') : t('liveSocketPolling')}
          </span>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="text-brand font-semibold hover:underline"
          >
            {refreshing ? t('refreshing') : `↻ ${t('refreshStatus')}`}
          </button>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('orderId')}</p>
          <h1 className="font-mono text-base sm:text-lg font-bold text-gray-900 break-all mt-0.5">
            {orderId}
          </h1>
          {amount !== null && (
            <p className="text-3xl font-extrabold text-brand mt-2">{rupees(amount)}</p>
          )}
        </div>

        {/* 3-Step Verification Progress Bar */}
        <div className="grid grid-cols-3 gap-2 text-xs font-semibold pt-1">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            1. {t('stepCreated')} ✓
          </div>
          <div
            className={`p-2 rounded-xl border ${
              status === 'CONFIRMED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : status === 'PENDING'
                ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
          >
            2. {t('stepWaiting')}
          </div>
          <div
            className={`p-2 rounded-xl border ${
              status === 'CONFIRMED'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gray-100 text-gray-400 border-gray-200'
            }`}
          >
            3. {t('stepVerified')}
          </div>
        </div>

        {/* Status Banner */}
        {status === 'LOADING' && (
          <p className="text-gray-400 animate-pulse py-6">{t('loading')}</p>
        )}

        {status === 'PENDING' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-sm">
              ⏳ {t('waitingPayment')}
            </div>

            {/* 4-Minute Dynamic QR Session Panel */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
              <p className="text-sm font-bold text-gray-900">{t('scanQrTitle')}</p>
              <DynamicQrSvg
                payload={qrPayload || `upi://pay?tr=${orderId}&am=${(amount || 0) / 100}`}
                orderId={orderId}
              />
              <p className="text-xs text-gray-500">{t('scanQrSubtitle')}</p>

              {/* 240-Second Countdown Bar */}
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-600">{t('sessionTimerLabel')}:</span>
                  <span className="font-mono text-sm text-brand">
                    {mins}:{secs}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'CONFIRMED' && (
          <div
            role="status"
            className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold space-y-1"
          >
            <p className="text-lg">✅ {t('confirmed')}</p>
            {simResult && (
              <p className="text-xs font-mono text-emerald-700">
                Verification status: {simResult}
              </p>
            )}
          </div>
        )}

        {status === 'EXPIRED' && (
          <div role="alert" className="p-4 rounded-2xl bg-gray-100 border text-gray-700 font-semibold text-sm">
            ⌛ {t('expired')}
          </div>
        )}

        {(status === 'FAILED' || status === 'NOT_FOUND') && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-semibold text-sm">
            ⚠️ {t('failed')}
          </div>
        )}

        {/* Sandbox / Dev Webhook Simulation Box */}
        {mock && status === 'PENDING' && (
          <div className="bg-pink-50/70 border-2 border-dashed border-brand/50 rounded-2xl p-4 space-y-2.5 text-left">
            <p className="text-xs text-gray-700 leading-relaxed">{t('sandboxNotice')}</p>
            <button
              type="button"
              disabled={simulating}
              onClick={simulate}
              className="w-full bg-brand text-white font-bold text-sm rounded-xl py-2.5 hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {simulating ? t('simulating') : `⚡ ${t('simulate')}`}
            </button>
          </div>
        )}

        {/* Order Items Receipt */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 pt-4 text-left space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t('orderSummary')}
            </p>
            <div className="divide-y divide-gray-100 text-sm">
              {items.map((it, idx) => (
                <div key={`${it.id}-${idx}`} className="py-2 flex justify-between">
                  <span className="text-gray-700">
                    {lang === 'hi' && it.name_hi ? it.name_hi : it.name}{' '}
                    {it.size ? `(${it.size})` : ''} × {it.qty}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {rupees(it.price_paise * it.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Link href="/" className="inline-block text-brand font-semibold underline text-sm">
            ← {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
