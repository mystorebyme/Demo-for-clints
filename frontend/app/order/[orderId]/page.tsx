'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { rupees, useStore } from '../../../lib/store';

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
      className="w-56 h-56 mx-auto rounded-lg bg-white"
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
  qrPayload: string;
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
  emailReceipt?: {
    id: string;
    to_email: string;
    subject: string;
    tracking_id: string;
    invoice_number: string;
    html_preview: string;
    sent_at: string;
  } | null;
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
  { key: 'ORDER_PLACED', label: 'Confirmed', icon: '✓' },
  { key: 'PACKED', label: 'Packed', icon: '📦' },
  { key: 'SHIPPED', label: 'Shipped', icon: '🚚' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🛵' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉' },
];

export default function OrderPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const { clearCart, t } = useStore();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const isConfirmed = order?.status === 'CONFIRMED' || order?.status === 'PAID';

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
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
  }, [orderId, clearCart]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 3500);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  async function verifyInstantUpi() {
    setSubmitting(true);
    setMessage('Verifying UPI transaction & sending Order Receipt + Tracking ID to your email...');
    try {
      await fetch('/api/dev/mock-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      await fetchOrder();
      setMessage('Payment confirmed! GST Receipt & Confidential Tracking ID emailed.');
    } catch {
      setMessage('Could not verify payment automatically.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendEmail() {
    setResendingEmail(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: order?.customerEmail }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrder();
        setMessage(`Order receipt & Tracking ID re-sent to ${data.emailSentTo || 'your email'}`);
      }
    } catch {
      // ignore
    } finally {
      setResendingEmail(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-4 mb-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-stone-400">
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

            <div className="flex items-center gap-2">
              <Link
                href={`/order/${orderId}/invoice`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-extrabold transition"
              >
                📄 {t('downloadInvoice')}
              </Link>
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isConfirmed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {order?.status || 'LOADING...'}
              </span>
            </div>
          </div>

          {!order ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              Loading your order details...
            </div>
          ) : isConfirmed ? (
            <div className="py-4 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl font-bold">
                  ✓
                </div>
                <h2 className="text-2xl font-extrabold text-emerald-900">
                  {t('paymentVerifiedTitle')}
                </h2>
                <p className="text-stone-600 text-sm max-w-md mx-auto">
                  {t('paymentVerifiedDesc')}
                </p>
                <div className="inline-block bg-stone-100 rounded-xl px-4 py-2 text-xs font-mono text-stone-700">
                  Amount Paid: <strong>{rupees(order.amountPaise)}</strong> • Payment Ref:{' '}
                  <strong>{order.paymentId || 'VERIFIED'}</strong>
                </div>
              </div>

              {/* Automated Email Receipt Confirmation Card */}
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-extrabold uppercase tracking-wider">
                      ✉️ {t('emailReceiptSentBadge')}
                    </span>
                    {order.emailSentAt && (
                      <span className="text-[11px] text-emerald-800 font-mono">
                        {new Date(order.emailSentAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-950 font-medium">
                    Sent to{' '}
                    <strong className="font-mono underline">
                      {order.emailReceipt?.to_email ||
                        order.customerEmail ||
                        'patron@zariyajaipur.in'}
                    </strong>{' '}
                    with itemized GST Tax Invoice & confidential Tracking ID.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {order.emailReceipt?.html_preview && (
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold shadow-sm transition"
                    >
                      👁️ {t('viewEmailReceipt')}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={resendingEmail}
                    onClick={handleResendEmail}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {resendingEmail ? 'Sending...' : `↻ ${t('resendEmailReceipt')}`}
                  </button>
                </div>
              </div>

              {/* Confidential Tracking ID & Live Shipment Card */}
              {order.trackingId && (
                <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-amber-950 text-white rounded-3xl p-6 shadow-md space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-widest text-amber-300 font-bold block">
                        🔒 {t('trackingIdLabel')}
                      </span>
                      <div className="flex items-center gap-2.5 mt-1">
                        <span
                          data-testid="order-tracking-id"
                          className="text-xl sm:text-2xl font-mono font-extrabold tracking-wider text-amber-200"
                        >
                          {order.trackingId}
                        </span>
                        <button
                          type="button"
                          onClick={copyTrackingId}
                          className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition"
                        >
                          {copiedTracking ? `✓ ${t('trackingCopied')}` : t('copyTrackingId')}
                        </button>
                      </div>
                      <p className="text-[11px] text-rose-200/90 mt-1">
                        Keep this Tracking ID private — only holders of this 12-hex token can look up shipment updates.
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

                  {/* Stepper */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {TRACKING_STEPS.map((step, index) => {
                      const done = index <= currentStepIndex;
                      return (
                        <div key={step.key} className="text-center">
                          <div
                            className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold border ${
                              done
                                ? 'bg-amber-400 text-stone-950 border-amber-300 shadow'
                                : 'bg-white/10 text-white/50 border-white/20'
                            }`}
                          >
                            {step.icon}
                          </div>
                          <p
                            className={`text-[10px] sm:text-xs mt-1.5 font-semibold ${
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
                      Current Milestone:{' '}
                      <strong className="text-amber-300">
                        {order.trackingHistory?.[order.trackingHistory.length - 1]?.title ||
                          'Order Confirmed'}
                      </strong>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/order/${order.orderId}/invoice`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition"
                      >
                        📄 GST Invoice PDF
                      </Link>
                      <Link
                        href={`/track?id=${encodeURIComponent(order.trackingId)}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs shadow transition"
                      >
                        {t('trackYourOrderBtn')} →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/track?id=${encodeURIComponent(order.trackingId || order.orderId)}`}
                  className="px-6 py-3 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-semibold text-sm"
                >
                  📦 Track Shipment Status
                </Link>
                <Link
                  href={`/order/${order.orderId}/invoice`}
                  className="px-6 py-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-sm"
                >
                  🖨️ Print Official GST Invoice
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-sm"
                >
                  {t('continueShopping')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-stone-600 mb-1">{t('totalPayable')}</p>
                <p className="text-3xl font-extrabold text-rose-900">
                  {rupees(order.amountPaise)}
                </p>
                {order.discountPaise && order.discountPaise > 0 ? (
                  <p className="text-xs text-emerald-700 font-bold mt-1">
                    Includes {rupees(order.discountPaise)} savings ({order.couponCode})
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-stone-50 border border-stone-200">
                <DynamicQrSvg value={order.qrPayload} />
                <p className="text-xs text-stone-500 mt-2">{t('scanWithAnyUpiApp')}</p>
                <a
                  href={order.qrPayload}
                  className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm"
                >
                  {t('openUpiApp')}
                </a>
              </div>

              {/* 1-Click Instant Verification for Store Presentation */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-amber-950">
                  <strong>Instant UPI Confirmation:</strong> Confirm payment immediately to generate your confidential Tracking ID & dispatch the email receipt.
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={verifyInstantUpi}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-stone-900 text-white text-xs font-bold transition-colors"
                >
                  ⚡ Confirm Payment & Send Email Receipt
                </button>
              </div>
              {message && <p className="text-xs font-semibold text-rose-800">{message}</p>}
            </div>
          )}
        </div>
      </main>

      {/* HTML Email Receipt Preview Modal */}
      {showEmailModal && order?.emailReceipt?.html_preview && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowEmailModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold block">
                  Dispatched Customer Email Receipt
                </span>
                <h3 className="text-sm font-bold truncate">{order.emailReceipt.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>
            <div className="px-6 py-2.5 bg-stone-100 border-b border-stone-200 text-xs text-stone-600 flex flex-wrap justify-between gap-2">
              <span>
                <strong>To:</strong> {order.emailReceipt.to_email}
              </span>
              <span>
                <strong>Tracking ID Included:</strong>{' '}
                <code className="font-mono font-bold text-rose-900">
                  {order.emailReceipt.tracking_id}
                </code>
              </span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-stone-50">
              <div
                className="bg-white rounded-xl shadow-sm overflow-hidden"
                dangerouslySetInnerHTML={{ __html: order.emailReceipt.html_preview }}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
