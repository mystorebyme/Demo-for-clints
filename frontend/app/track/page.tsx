'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { rupees, useStore } from '../../lib/store';

type TrackingEvent = {
  status: string;
  title: string;
  location: string;
  timestamp: string;
  note: string;
};

type TrackedOrder = {
  orderId: string;
  trackingId: string;
  invoiceNumber?: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  courierName: string;
  estimatedDelivery: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  address: string;
  amountPaise: number;
  items: { id: number; name: string; qty: number; size: string; price_paise: number }[];
  trackingHistory: TrackingEvent[];
  createdAt: string;
};

const TRACKING_STEPS = [
  { key: 'ORDER_PLACED', label: 'Order Confirmed', stepCode: '01' },
  { key: 'PACKED', label: 'Packed at Atelier', stepCode: '02' },
  { key: 'SHIPPED', label: 'Shipped via Air', stepCode: '03' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', stepCode: '04' },
  { key: 'DELIVERED', label: 'Delivered', stepCode: '05' },
];

export default function TrackOrderPage() {
  const { t, lang } = useStore();
  const [queryId, setQueryId] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookupOrder = useCallback(async (idToSearch: string) => {
    const clean = idToSearch.trim();
    if (!clean) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(clean)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.orderId) {
        setOrder(null);
        setError(
          data.error ||
            'Please enter the valid 12-digit Tracking ID sent to your email upon order confirmation.'
        );
      } else {
        setOrder(data);
      }
    } catch {
      setError('Could not connect to tracking service. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id');
      if (idParam) {
        setQueryId(idParam);
        lookupOrder(idParam);
      }
    }
  }, [lookupOrder]);

  useEffect(() => {
    if (!order?.trackingId) return;
    const interval = setInterval(() => {
      fetch(`/api/track/${encodeURIComponent(order.trackingId)}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (d?.success && d.orderId) setOrder(d);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [order?.trackingId]);

  const currentStepIndex = order?.fulfillmentStatus
    ? TRACKING_STEPS.findIndex((s) => s.key === order.fulfillmentStatus)
    : -1;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6">
        {/* Search Box Card */}
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-sm">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-extrabold uppercase tracking-wider mb-2">
              Live Shipment Tracking
            </span>
            <h1 className="text-xl sm:text-3xl font-serif font-extrabold text-stone-900">
              {t('trackOrderTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">{t('trackOrderSubtitle')}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookupOrder(queryId);
            }}
            className="mt-5 flex flex-col sm:flex-row gap-2.5 sm:gap-3"
          >
            <input
              type="text"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              placeholder={t('trackInputPlaceholder')}
              aria-label="Tracking ID"
              className="flex-1 px-4 py-3.5 rounded-xl border border-stone-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-white font-bold text-sm shadow-sm transition-colors"
            >
              {loading ? 'Checking...' : t('trackBtn')}
            </button>
          </form>

          {/* 12-Digit AWB Structure Legend + Sample Button */}
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
            <div>
              <span className="font-bold text-stone-800">Format:</span>{' '}
              <code className="font-mono bg-stone-100 px-1.5 py-0.5 rounded">TRK-KC-YYMMDDSSPPPP</code>{' '}
              <span className="text-[11px] text-stone-500">
                (6-Digit Date + 08 State Code + 4-Digit Security PIN)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setQueryId('TRK-KC-261019081001');
                lookupOrder('TRK-KC-261019081001');
              }}
              className="text-[11px] font-bold text-amber-900 hover:text-rose-900 underline"
            >
              {lang === 'hi'
                ? 'सैंपल ट्रैकिंग देखें: TRK-KC-261019081001'
                : 'Load Sample Shipment: TRK-KC-261019081001'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Tracking Result */}
        {order && (
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-sm space-y-6 sm:space-y-8">
            {/* Top Summary Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-stone-400">
                    12-Digit AWB Tracking ID
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    {order.paymentStatus}
                  </span>
                </div>
                <h2
                  data-testid="tracked-id-heading"
                  className="text-xl sm:text-3xl font-mono font-extrabold text-rose-900 mt-1"
                >
                  {order.trackingId}
                </h2>
                <p className="text-xs text-stone-500 mt-1 font-mono">
                  Order Reference: <strong>{order.orderId}</strong> | Amount:{' '}
                  <strong>{rupees(order.amountPaise)}</strong>
                </p>
              </div>

              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl px-4 py-3 text-xs space-y-1">
                <div>
                  <span className="text-stone-500">{t('courierPartner')}: </span>
                  <strong className="text-stone-900">{order.courierName}</strong>
                </div>
                <div>
                  <span className="text-stone-500">{t('estimatedDelivery')}: </span>
                  <strong className="text-emerald-800">{order.estimatedDelivery}</strong>
                </div>
                <div className="pt-1 flex items-center gap-3">
                  <Link
                    href={`/order/${order.orderId}`}
                    className="inline-flex items-center gap-1 text-stone-900 font-extrabold hover:underline"
                  >
                    Order Details
                  </Link>
                  <Link
                    href={`/order/${order.orderId}/invoice`}
                    className="inline-flex items-center gap-1 text-rose-900 font-extrabold hover:underline"
                  >
                    Download GST Tax Invoice
                  </Link>
                </div>
              </div>
            </div>

            {/* Visual 5-Stage Progress Stepper (Zero Emojis) */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-3">
                Shipment Progress
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-3">
                {TRACKING_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div
                      key={step.key}
                      className={`p-3 rounded-2xl border transition-all flex sm:block items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-amber-400'
                          : isCompleted
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-stone-50 border-stone-200 text-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between sm:mb-1.5 gap-2">
                        <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-black/10">
                          {step.stepCode}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase">
                          Step {index + 1}/5
                        </span>
                      </div>
                      <p className="text-xs font-extrabold leading-snug">{step.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Activity Timeline & Customer Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pt-2 border-t border-stone-200">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-stone-900">
                  {t('trackingTimelineTitle')}
                </h3>

                {order.trackingHistory && order.trackingHistory.length > 0 ? (
                  <ol className="relative border-l-2 border-rose-200 ml-3 space-y-4">
                    {[...order.trackingHistory].reverse().map((ev, i) => (
                      <li key={`${ev.status}-${i}`} className="ml-5">
                        <span
                          className={`absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white ${
                            i === 0 ? 'bg-rose-900 text-white' : 'bg-emerald-600 text-white'
                          } text-[9px] font-mono font-bold`}
                        >
                          {order.trackingHistory.length - i}
                        </span>
                        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-stone-900">
                              {ev.title}
                            </h4>
                            <span className="text-[11px] font-mono text-stone-500">
                              {new Date(ev.timestamp).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-rose-800 font-semibold mt-0.5">
                            Location: {ev.location}
                          </p>
                          <p className="text-xs text-stone-600 mt-1">{ev.note}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-stone-500">
                    Tracking updates will appear here once your order is dispatched.
                  </p>
                )}
              </div>

              {/* Delivery Destination & Ordered Items Summary */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                  <h4 className="font-extrabold uppercase tracking-wider text-stone-400">
                    Delivery Destination
                  </h4>
                  <p className="font-bold text-stone-900 text-sm">{order.customerName}</p>
                  <p className="text-stone-600 leading-relaxed">{order.address}</p>
                  <p className="text-stone-500 font-mono">Phone: {order.phone}</p>
                  {order.customerEmail && (
                    <p className="text-stone-500 font-mono">Email: {order.customerEmail}</p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2.5">
                  <h4 className="font-extrabold uppercase tracking-wider text-stone-400">
                    Items in Shipment
                  </h4>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-2 text-stone-700">
                      <span>
                        {item.name} ({item.size}) x {item.qty}
                      </span>
                      <span className="font-bold text-stone-900">
                        {rupees(item.price_paise * item.qty)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-stone-200 pt-2 flex justify-between font-extrabold text-stone-900">
                    <span>Total Paid</span>
                    <span className="text-rose-900">{rupees(order.amountPaise)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
