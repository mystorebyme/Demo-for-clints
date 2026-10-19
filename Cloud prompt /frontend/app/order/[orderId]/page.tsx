'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { rupees, useStore } from '../../../lib/store';

type OrderResponse = {
  success: boolean;
  orderId: string;
  invoiceNumber?: string;
  status: string;
  subtotalPaise?: number;
  discountPaise?: number;
  couponCode?: string | null;
  gstPaise?: number;
  amountPaise: number;
  customerName: string;
  phone: string;
  address: string;
  items: Array<{
    id: number;
    name: string;
    name_hi?: string;
    qty: number;
    size: string;
    price_paise: number;
    line_total_paise: number;
  }>;
  trackingId: string | null;
  courierName?: string;
  fulfillmentStatus?: string;
  estimatedDelivery?: string | null;
  qrExpiresAt: string;
  qrPayload: string;
};

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
        grid[r][c] = Math.abs(hash) % 10 < 5;
      }
    }
    return grid;
  }, [payload, orderId]);

  return (
    <svg
      viewBox="0 0 21 21"
      className="w-56 h-56 mx-auto rounded-xl bg-white p-2"
      role="img"
      aria-label="UPI Payment QR Code"
    >
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1c1917" />
          ) : null
        )
      )}
    </svg>
  );
}

export default function OrderPaymentPage() {
  const params = useParams();
  const orderId = String(params?.orderId || '');
  const { lang, clearCart, setAppliedCoupon, t } = useStore();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(240);
  const [simulating, setSimulating] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        setError('Order not found');
        return;
      }
      const data: OrderResponse = await res.json();
      setOrder(data);

      const rem = Math.max(
        0,
        Math.floor((new Date(data.qrExpiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(rem);

      if (data.status === 'CONFIRMED') {
        clearCart();
        setAppliedCoupon('');
      }
    } catch {
      // ignore transient poll failure
    }
  }, [orderId, clearCart, setAppliedCoupon]);

  useEffect(() => {
    fetchOrder();
    const poll = setInterval(fetchOrder, 3000);
    return () => clearInterval(poll);
  }, [fetchOrder]);

  useEffect(() => {
    if (!order || (order.status !== 'PENDING' && order.status !== 'CREATED')) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  async function handleSimulateWebhook() {
    if (!orderId) return;
    setSimulating(true);
    try {
      await fetch('/api/dev/mock-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      await fetchOrder();
    } finally {
      setSimulating(false);
    }
  }

  function handleCopyTracking(id: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id).catch(() => {});
    }
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-3">{error}</h1>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-rose-800 text-white font-semibold text-sm"
          >
            {t('continueShopping')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const status = order?.status || 'PENDING';
  const isConfirmed = status === 'CONFIRMED';
  const isExpired = status === 'EXPIRED' || (secondsLeft <= 0 && !isConfirmed);
  const isFailed = status === 'FAILED' || status === 'MANUAL_REVIEW';

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Order Reference
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-mono">
                {orderId}
              </h1>
              {order?.invoiceNumber && (
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  GST Invoice: <strong>{order.invoiceNumber}</strong>
                </p>
              )}
            </div>

            <span
              data-testid="order-status-badge"
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                isConfirmed
                  ? 'bg-emerald-100 text-emerald-900'
                  : isExpired
                    ? 'bg-stone-200 text-stone-700'
                    : isFailed
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
              }`}
            >
              {isConfirmed ? 'CONFIRMED' : isExpired ? 'EXPIRED' : status}
            </span>
          </div>

          {/* CONFIRMED STATE WITH CLIENT TRACKING ID + PRINTABLE GST INVOICE */}
          {isConfirmed && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mb-4">
                ✓
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 mb-2">
                {t('orderConfirmedTitle')}
              </h2>
              <p className="text-stone-600 text-sm mb-6 max-w-md mx-auto">
                {t('orderConfirmedSubtitle')}
              </p>

              {/* Tracking ID Box for Customer */}
              {order?.trackingId && (
                <div className="max-w-lg mx-auto mb-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-2 border-emerald-300 shadow-sm text-left">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                      📦 {t('trackingIdLabel')} (Live Shipment Tracking)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-700 text-white">
                      {order.fulfillmentStatus || 'ORDER_PLACED'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-emerald-200">
                    <div>
                      <p
                        data-testid="order-tracking-id"
                        className="text-xl sm:text-2xl font-extrabold font-mono text-stone-900 tracking-wide"
                      >
                        {order.trackingId}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {t('courierPartnerLabel')}:{' '}
                        <strong className="text-stone-800">
                          {order.courierName || 'Delhivery Express'}
                        </strong>
                        {order.estimatedDelivery ? ` • ETA: ${order.estimatedDelivery}` : ''}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyTracking(order.trackingId!)}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors"
                    >
                      {copiedTracking
                        ? '✓ Copied!'
                        : lang === 'hi'
                          ? 'कॉपी करें'
                          : 'Copy ID'}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-stone-600">
                      {lang === 'hi'
                        ? 'जैसे-जैसे एडमिन आपके ऑर्डर को अपडेट करेगा, आप इसे वेबसाइट पर लाइव ट्रैक कर सकते हैं।'
                        : 'Track your order live on the website as the admin updates each stage.'}
                    </p>
                    <Link
                      href={`/track?id=${encodeURIComponent(order.trackingId)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      <span>📦</span>
                      <span>
                        {lang === 'hi' ? 'अभी ऑर्डर ट्रैक करें →' : 'Track Order Live →'}
                      </span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Buttons: GST Invoice PDF + Continue Shopping */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/order/${orderId}/invoice`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-sm"
                >
                  <span>🧾</span>
                  <span>{t('downloadGstInvoice')}</span>
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm"
                >
                  {t('continueShopping')}
                </Link>
              </div>
            </div>
          )}

          {/* EXPIRED STATE */}
          {isExpired && !isConfirmed && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-2xl mb-4">
                ⏰
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 mb-2">
                {t('orderExpiredTitle')}
              </h2>
              <p className="text-stone-600 text-sm mb-6 max-w-md mx-auto">
                {t('orderExpiredSubtitle')}
              </p>
              <Link
                href="/checkout"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm"
              >
                {t('checkout')}
              </Link>
            </div>
          )}

          {/* FAILED STATE */}
          {isFailed && !isConfirmed && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-2xl mb-4">
                !
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 mb-2">
                {t('orderFailedTitle')}
              </h2>
              <p className="text-stone-600 text-sm mb-6 max-w-md mx-auto">
                {t('orderFailedSubtitle')}
              </p>
              <Link
                href="/checkout"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm"
              >
                {t('checkout')}
              </Link>
            </div>
          )}

          {/* PENDING QR PAYMENT STATE */}
          {!isConfirmed && !isExpired && !isFailed && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-stone-900 mb-1">{t('scanQrToPay')}</h2>
              <p className="text-sm text-stone-500 mb-4">
                {t('totalPayable')}:{' '}
                <strong className="text-rose-900 text-lg">
                  {order ? rupees(order.amountPaise) : '...'}
                </strong>
                {order?.couponCode && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                    🎟️ {order.couponCode} (−{rupees(order.discountPaise || 0)})
                  </span>
                )}
              </p>

              <div className="inline-block p-4 rounded-3xl bg-white border-2 border-rose-800/20 shadow-sm mb-4">
                <DynamicQrSvg payload={order?.qrPayload || orderId} orderId={orderId} />
              </div>

              <div className="mb-5">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  <span>⏳ {t('qrExpiresIn')}:</span>
                  <span className="font-mono text-sm">
                    {mm}:{ss}
                  </span>
                </span>
              </div>

              <p className="text-xs text-stone-500 mb-6 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{t('waitingForConfirmation')}</span>
              </p>

              {/* Demo Mode Webhook Simulator Button */}
              <div className="pt-5 border-t border-stone-200">
                <button
                  type="button"
                  disabled={simulating}
                  onClick={handleSimulateWebhook}
                  data-testid="simulate-payment-btn"
                  className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-400 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
                >
                  {simulating ? 'Verifying Webhook...' : `⚡ ${t('simulateSuccessBtn')}`}
                </button>
              </div>
            </div>
          )}

          {/* Order Items & Delivery Summary */}
          {order && (
            <div className="mt-8 pt-6 border-t border-stone-200 text-xs text-stone-600 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-stone-800">Customer:</span>
                <span>
                  {order.customerName} ({order.phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-stone-800">Delivery Address:</span>
                <span className="text-right max-w-xs">{order.address}</span>
              </div>
              {order.discountPaise && order.discountPaise > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Applied ({order.couponCode}):</span>
                  <span>− {rupees(order.discountPaise)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-bold text-stone-900 text-sm pt-1">
                <span>Total Amount (Incl. 5% GST):</span>
                <span>{rupees(order.amountPaise)}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
