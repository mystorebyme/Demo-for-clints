'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useStore } from '../../lib/store';

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
  paymentStatus: string;
  fulfillmentStatus: string;
  courierName: string;
  estimatedDelivery: string;
  destinationHub: string;
  items: { id: number; name: string; qty: number; size: string }[];
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
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-xs">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-[10px] font-bold uppercase tracking-[0.18em] mb-2">
              COURIER CONSIGNMENT TRACKING
            </span>
            <h1 className="text-xl sm:text-3xl font-serif font-bold text-stone-950">
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
              className="flex-1 px-4 py-3.5 rounded-xl border border-stone-300 font-mono text-sm focus:outline-none focus:border-stone-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-300 font-bold text-xs uppercase tracking-wider shadow-xs transition-colors"
            >
              {loading ? 'Checking...' : t('trackBtn')}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Tracking Result (Zero Personal Information Exposed) */}
        {order && (
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-xs space-y-6 sm:space-y-8">
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
                  className="text-xl sm:text-3xl font-mono font-extrabold text-stone-950 mt-1"
                >
                  {order.trackingId}
                </h2>
                <p className="text-xs text-stone-500 mt-1 font-mono">
                  Order Reference: <strong>{order.orderId}</strong>
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs space-y-1">
                <div>
                  <span className="text-stone-500">{t('courierPartner')}: </span>
                  <strong className="text-stone-900">{order.courierName}</strong>
                </div>
                <div>
                  <span className="text-stone-500">{t('estimatedDelivery')}: </span>
                  <strong className="text-emerald-800">{order.estimatedDelivery}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Destination Hub: </span>
                  <strong className="text-stone-900">{order.destinationHub}</strong>
                </div>
              </div>
            </div>

            {/* Visual 5-Stage Progress Stepper */}
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
                          ? 'bg-stone-950 text-amber-300 border-stone-950 shadow-md'
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

            {/* Detailed Activity Timeline & Privacy-Protected Package Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pt-2 border-t border-stone-200">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-stone-900">
                  {t('trackingTimelineTitle')}
                </h3>

                {order.trackingHistory && order.trackingHistory.length > 0 ? (
                  <ol className="relative border-l-2 border-stone-300 ml-3 space-y-4">
                    {[...order.trackingHistory].reverse().map((ev, i) => (
                      <li key={`${ev.status}-${i}`} className="ml-5">
                        <span
                          className={`absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white ${
                            i === 0 ? 'bg-stone-950 text-amber-300' : 'bg-emerald-700 text-white'
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
                          <p className="text-xs text-amber-900 font-semibold mt-0.5">
                            Facility: {ev.location}
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

              {/* Consignment Privacy & Package Summary (NO Personal Name/Phone/Address Shown) */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                    CONSIGNEE PRIVACY PROTECTED
                  </span>
                  <h4 className="font-bold text-stone-900 text-xs">
                    Personal Details Hidden on Public Tracking
                  </h4>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    {lang === 'hi'
                      ? 'ग्राहक की गोपनीयता के लिए नाम, मोबाइल नंबर, ईमेल और घर का पता सार्वजनिक ट्रैकिंग पेज पर नहीं दिखाया जाता। अपनी पूरी ऑर्डर डिटेल और GST बिल देखने के लिए प्रोफ़ाइल में ईमेल वेरिफाई करें।'
                      : 'For customer security, recipient name, phone number, email address, and street address are never displayed on public tracking lookups.'}
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/profile"
                      className="inline-block w-full text-center py-2 px-3 rounded-xl bg-stone-950 text-amber-300 text-[11px] font-bold uppercase tracking-wider hover:bg-stone-800 transition"
                    >
                      {lang === 'hi'
                        ? 'प्रोफ़ाइल में ऑर्डर और पता देखें'
                        : 'Verify Email in Profile for Full Details'}
                    </Link>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2.5">
                  <h4 className="font-extrabold uppercase tracking-wider text-stone-400">
                    Package Contents ({order.items?.reduce((s, i) => s + i.qty, 0) || 0} pcs)
                  </h4>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-2 text-stone-700">
                      <span>
                        {item.name} (Size: {item.size})
                      </span>
                      <span className="font-mono font-bold text-stone-900">x {item.qty}</span>
                    </div>
                  ))}
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
