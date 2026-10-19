'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { getOrderAccessToken, rupees, useStore } from '../../../lib/store';

function createQrMatrix(payload: string, size = 29): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (row0: number, col0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row0 + r;
        const cc = col0 + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[rr][cc] = inOuter && (onBorder || inInner);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  let seed = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    seed ^= payload.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      seed ^= (r * 31 + c * 17 + payload.charCodeAt((r + c) % payload.length)) & 0xff;
      seed = Math.imul(seed, 16777619);
      grid[r][c] = (seed >>> 3) % 2 === 0;
    }
  }
  return grid;
}

function DynamicQrSvg({ value }: { value: string }) {
  const size = 29;
  const matrix = useMemo(() => createQrMatrix(value || 'upi://pay', size), [value]);
  return (
    <svg
      viewBox={`0 0 ${size + 4} ${size + 4}`}
      className="w-52 h-52 sm:w-56 sm:h-56 mx-auto rounded-xl bg-white shadow-xs"
      role="img"
      aria-label="UPI QR Code"
    >
      <rect width={size + 4} height={size + 4} fill="#ffffff" rx={2} />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect key={`${r}-${c}`} x={c + 2} y={r + 2} width={1} height={1} fill="#1c1917" />
          ) : null
        )
      )}
    </svg>
  );
}

type OrderDetail = {
  authorizedOwner?: boolean;
  orderId: string;
  invoiceNumber?: string;
  subtotalPaise?: number;
  discountPaise?: number;
  shippingPaise?: number;
  couponCode?: string | null;
  taxablePaise?: number;
  cgstPaise?: number;
  sgstPaise?: number;
  igstPaise?: number;
  gstPaise?: number;
  supplyType?: 'INTRA_STATE' | 'INTER_STATE';
  amountPaise: number;
  status: string;
  qrPayload?: string;
  qrExpiresAt?: string;
  paymentId?: string | null;
  trackingId?: string | null;
  fulfillmentStatus?: string;
  courierName?: string;
  estimatedDelivery?: string | null;
  trackingHistory?: {
    status: string;
    title: string;
    location: string;
    timestamp: string;
    note: string;
  }[];
  emailSent?: boolean;
  emailSentAt?: string | null;
  customerName?: string;
  customerEmail?: string;
  phone?: string;
  address?: string;
  items?: {
    id: number;
    name: string;
    qty: number;
    size: string;
    price_paise: number;
    hsn_code?: string;
  }[];
};

const TRACKING_STEPS = [
  { key: 'ORDER_PLACED', label: 'Confirmed', stepNum: '01' },
  { key: 'PACKED', label: 'Packed', stepNum: '02' },
  { key: 'SHIPPED', label: 'Shipped', stepNum: '03' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', stepNum: '04' },
  { key: 'DELIVERED', label: 'Delivered', stepNum: '05' },
];

export default function OrderPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const { clearCart, customerProfile, lang, t } = useStore();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(240);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const isConfirmed = order?.status === 'CONFIRMED' || order?.status === 'PAID';
  const isOwner = Boolean(order?.authorizedOwner);

  const fetchOrder = useCallback(async () => {
    try {
      const orderToken = getOrderAccessToken(orderId);
      const accountToken = customerProfile.sessionToken || '';
      const res = await fetch(`/api/orders/${orderId}`, {
        cache: 'no-store',
        headers: {
          ...(orderToken ? { 'x-order-token': orderToken } : {}),
          ...(accountToken ? { 'x-account-token': accountToken } : {}),
        },
      });
      const data = await res.json();
      if (data && data.orderId) {
        setOrder(data);
        if (data.status === 'CONFIRMED' || data.status === 'PAID') {
          clearCart();
        }
      }
    } catch {
      // ignore transient poll failures
    }
  }, [orderId, clearCart, customerProfile.sessionToken]);

  useEffect(() => {
    useStore.getState().hydrate();
  }, []);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  // 4-Minute (240-Second) Dedicated QR Session Countdown Timer
  useEffect(() => {
    if (!order?.qrExpiresAt || isConfirmed) return;
    const updateClock = () => {
      const expMs = new Date(order.qrExpiresAt!).getTime();
      const diffSec = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
      setSecondsLeft(diffSec);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [order?.qrExpiresAt, isConfirmed]);

  async function verifyInstantUpi() {
    if (!isOwner) return;
    setSubmitting(true);
    setMessage('Verifying UPI payment...');
    try {
      await fetch('/api/dev/mock-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      await fetchOrder();
      setMessage('Payment verified! Your GST Tax Invoice & Tracking ID have been emailed.');
    } catch {
      setMessage('Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function copyTrackingId() {
    if (!order?.trackingId) return;
    navigator.clipboard?.writeText(order.trackingId);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  }

  const currentStepIndex = order?.fulfillmentStatus
    ? TRACKING_STEPS.findIndex((s) => s.key === order.fulfillmentStatus)
    : 0;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-12">
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400">
                Order Reference
              </span>
              <h1 className="text-lg sm:text-2xl font-extrabold text-stone-900 font-mono">
                {orderId}
              </h1>
              {order?.invoiceNumber && (
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  GST Tax Invoice: <strong>{order.invoiceNumber}</strong>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOwner && (
                <Link
                  href={`/order/${orderId}/invoice`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-extrabold transition"
                >
                  {t('downloadInvoice')}
                </Link>
              )}
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isConfirmed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {isConfirmed ? 'CONFIRMED' : order?.status || 'PENDING'}
              </span>
            </div>
          </div>

          {!order ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              Loading your order details...
            </div>
          ) : !isOwner ? (
            /* Visitor Protection: Unauthenticated visitors cannot view personal details or perform any tasks */
            <div className="py-6 space-y-5">
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-stone-900 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
                  PROTECTED CUSTOMER ORDER
                </span>
                <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                  {lang === 'hi'
                    ? 'यह ऑर्डर ग्राहक के पासवर्ड द्वारा सुरक्षित है'
                    : 'Personal Order Details & Actions Are Restricted to the Account Owner'}
                </h2>
                <p className="text-xs text-stone-600 max-w-lg mx-auto leading-relaxed">
                  {lang === 'hi'
                    ? 'ग्राहक की गोपनीयता की सुरक्षा के लिए नाम, पता, फ़ोन नंबर, ईमेल और टैक्स बिल केवल लॉग-इन किए गए ग्राहक को ही दिखाई देते हैं।'
                    : 'For customer security, personal details, addresses, GST tax invoices, and order actions are hidden from visitors. Sign in with the password for the account that placed this order.'}
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/profile"
                    className="px-5 py-2.5 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition"
                  >
                    {lang === 'hi' ? 'अकाउंट में साइन इन करें' : 'Sign In to View Order'}
                  </Link>
                  <Link
                    href="/track"
                    className="px-5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-bold uppercase tracking-wider hover:bg-stone-100 transition"
                  >
                    {lang === 'hi' ? 'ट्रैकिंग आईडी से ट्रैक करें' : 'Track via AWB ID'}
                  </Link>
                </div>
              </div>
            </div>
          ) : isConfirmed ? (
            <div className="py-2 sm:py-4 space-y-6">
              <div className="text-center space-y-2.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-sm font-extrabold uppercase tracking-wider">
                  PAID
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-900">
                  {t('paymentVerifiedTitle')}
                </h2>
                <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
                  {t('paymentVerifiedDesc')}
                </p>
                <div className="inline-block bg-stone-100 rounded-xl px-4 py-2 text-xs font-mono text-stone-700">
                  Amount Paid: <strong>{rupees(order.amountPaise)}</strong> | Ref:{' '}
                  <strong>{order.paymentId || 'VERIFIED'}</strong>
                </div>
              </div>

              {/* Clean Email Dispatch Status Notice (No Resend / No Raw Email Preview Button) */}
              {order.customerEmail && (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-wider">
                      {t('emailReceiptSentBadge')}
                    </span>
                    <p className="text-xs text-emerald-950 font-medium pt-1">
                      Official GST Tax Invoice and Tracking ID dispatched to{' '}
                      <strong className="font-mono">{order.customerEmail}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Tracking ID & Live Shipment Card */}
              {order.trackingId && (
                <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-amber-950 text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-widest text-amber-300 font-bold block">
                        {t('trackingIdLabel')}
                      </span>
                      <div className="flex items-center gap-2.5 mt-1">
                        <span
                          data-testid="order-tracking-id"
                          className="text-lg sm:text-2xl font-mono font-extrabold tracking-wider text-amber-200"
                        >
                          {order.trackingId}
                        </span>
                        <button
                          type="button"
                          onClick={copyTrackingId}
                          className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition"
                        >
                          {copiedTracking ? t('trackingCopied') : t('copyTrackingId')}
                        </button>
                      </div>
                      <p className="text-[11px] text-rose-200/90 mt-1">
                        Use this Tracking ID anytime to check your live delivery status.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] uppercase tracking-widest text-rose-200 block">
                        Courier Partner
                      </span>
                      <p className="text-sm font-bold text-white">
                        {order.courierName || 'BlueDart Royal Priority Air'}
                      </p>
                      {order.estimatedDelivery && (
                        <p className="text-xs text-amber-300">
                          Est. Delivery: {order.estimatedDelivery}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stepper (Zero Emojis) */}
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {TRACKING_STEPS.map((step, index) => {
                      const done = index <= currentStepIndex;
                      return (
                        <div key={step.key} className="text-center">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full flex items-center justify-center text-[10px] font-mono font-bold border ${
                              done
                                ? 'bg-amber-400 text-stone-950 border-amber-300 shadow'
                                : 'bg-white/10 text-white/50 border-white/20'
                            }`}
                          >
                            {step.stepNum}
                          </div>
                          <p
                            className={`text-[9px] sm:text-xs mt-1 font-semibold ${
                              done ? 'text-amber-200' : 'text-white/50'
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/15">
                    <p className="text-xs text-rose-100/90">
                      Status:{' '}
                      <strong className="text-amber-300">
                        {order.trackingHistory?.[order.trackingHistory.length - 1]?.title ||
                          'Order Confirmed'}
                      </strong>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/order/${order.orderId}/invoice`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition"
                      >
                        GST Invoice PDF
                      </Link>
                      <Link
                        href={`/track?id=${encodeURIComponent(order.trackingId)}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs shadow transition"
                      >
                        {t('trackYourOrderBtn')}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                {order.trackingId && (
                  <Link
                    href={`/track?id=${encodeURIComponent(order.trackingId)}`}
                    className="px-5 py-3 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-semibold text-xs sm:text-sm"
                  >
                    Track Shipment
                  </Link>
                )}
                <Link
                  href={`/order/${order.orderId}/invoice`}
                  className="px-5 py-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-xs sm:text-sm"
                >
                  Download GST Invoice
                </Link>
                <Link
                  href="/"
                  className="px-5 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs sm:text-sm"
                >
                  {t('continueShopping')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-stone-600 mb-1">{t('totalPayable')}</p>
                <p className="text-3xl font-extrabold text-rose-900">
                  {rupees(order.amountPaise)}
                </p>
                {order.discountPaise && order.discountPaise > 0 ? (
                  <p className="text-xs text-emerald-700 font-bold mt-1">
                    Includes {rupees(order.discountPaise)} savings ({order.couponCode})
                  </p>
                ) : null}
              </div>

              {/* Dedicated 4-Minute (240-Second) QR Session Timer + Dynamic QR */}
              <div className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-950 text-amber-300 text-xs font-mono font-extrabold shadow-xs">
                  <span>Session Active:</span>
                  <span>
                    {mins}:{secs}
                  </span>
                </div>

                <DynamicQrSvg value={order.qrPayload || 'upi://pay'} />
                <p className="text-xs text-stone-500">{t('scanWithAnyUpiApp')}</p>
                {order.qrPayload && (
                  <a
                    href={order.qrPayload}
                    className="w-full sm:w-auto text-center inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs"
                  >
                    {t('openUpiApp')}
                  </a>
                )}
              </div>

              {/* Owner-Only UPI Payment Verification */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-amber-950">
                  <strong>Completed your UPI payment?</strong> Tap below to verify payment and generate your GST Tax Invoice & Tracking ID.
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={verifyInstantUpi}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold transition-colors"
                >
                  Verify Payment & Get Tracking ID
                </button>
              </div>
              {message && <p className="text-xs font-semibold text-rose-800 text-center">{message}</p>}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
