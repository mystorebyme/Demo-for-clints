'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { rupees, useStore } from '../../lib/store';

type TrackingEvent = {
  status: string;
  title: string;
  location: string;
  note: string;
  timestamp: string;
};

type TrackResponse = {
  success: boolean;
  error?: string;
  orderId: string;
  trackingId: string | null;
  invoiceNumber?: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  courierName: string;
  estimatedDelivery: string | null;
  trackingHistory: TrackingEvent[];
  customerName: string;
  phone: string;
  address: string;
  subtotalPaise?: number;
  discountPaise?: number;
  couponCode?: string | null;
  amountPaise: number;
  items: Array<{
    id: number;
    name: string;
    name_hi?: string;
    qty: number;
    size: string;
    price_paise: number;
    line_total_paise: number;
    image_url?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

const STAGES = [
  { key: 'ORDER_PLACED', labelKey: 'stageOrderPlaced', icon: '🧾' },
  { key: 'PACKED', labelKey: 'stagePacked', icon: '📦' },
  { key: 'SHIPPED', labelKey: 'stageShipped', icon: '🚚' },
  { key: 'OUT_FOR_DELIVERY', labelKey: 'stageOutForDelivery', icon: '🛵' },
  { key: 'DELIVERED', labelKey: 'stageDelivered', icon: '✅' },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('id') || '';
  const { lang, t } = useStore();

  const [inputId, setInputId] = useState(initialQuery || 'TRK-KC-1001');
  const [tracked, setTracked] = useState<TrackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackLookup = useCallback(async (queryToFetch: string) => {
    const clean = queryToFetch.trim();
    if (!clean) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(clean)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTracked(null);
        setError(
          data.error ||
            (lang === 'hi'
              ? 'कोई ऑर्डर नहीं मिला। डेमो के लिए TRK-KC-1001 आज़माएं।'
              : 'Order not found. Try demo ID: TRK-KC-1001')
        );
      } else {
        setTracked(data);
      }
    } catch {
      setError('Unable to reach tracking server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    const idParam = searchParams?.get('id') || 'TRK-KC-1001';
    setInputId(idParam);
    handleTrackLookup(idParam);
  }, [searchParams, handleTrackLookup]);

  const currentStageIndex = tracked
    ? STAGES.findIndex((s) => s.key === tracked.fulfillmentStatus)
    : -1;

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Search Box Card */}
      <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-amber-900 rounded-3xl p-6 sm:p-10 text-white shadow-md mb-8">
        <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-bold uppercase tracking-wider mb-3">
          📦 Real-Time Courier & Warehouse Tracker
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">{t('trackOrderTitle')}</h1>
        <p className="text-rose-100 text-sm mb-6 max-w-2xl">{t('trackOrderSubtitle')}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrackLookup(inputId);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder={t('trackInputPlaceholder')}
            data-testid="track-search-input"
            className="flex-1 px-4 py-3.5 rounded-xl text-stone-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={loading}
            data-testid="track-submit-btn"
            className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-sm shadow-sm transition-colors"
          >
            {loading ? 'Searching...' : `🔍 ${t('trackButton')}`}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-rose-100">
          <span>{lang === 'hi' ? 'डेमो ट्रैकिंग आईडी:' : 'Quick Demo Lookup:'}</span>
          <button
            type="button"
            onClick={() => {
              setInputId('TRK-KC-1001');
              handleTrackLookup('TRK-KC-1001');
            }}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 font-mono font-bold text-amber-200 transition-colors"
          >
            TRK-KC-1001 (Shipped Demo)
          </button>
          <button
            type="button"
            onClick={() => {
              setInputId('ORDDEMO1001');
              handleTrackLookup('ORDDEMO1001');
            }}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 font-mono font-bold text-white transition-colors"
          >
            ORDDEMO1001 (By Order ID)
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-5 text-sm font-medium mb-8">
          {error}
        </div>
      )}

      {tracked && (
        <div className="space-y-6">
          {/* Top Summary Banner */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    {t('trackingIdLabel')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                    Payment: {tracked.paymentStatus}
                  </span>
                </div>
                <h2
                  data-testid="tracked-id-heading"
                  className="text-2xl sm:text-3xl font-extrabold font-mono text-stone-900 mt-1"
                >
                  {tracked.trackingId || tracked.orderId}
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Order ID: <strong className="font-mono text-stone-700">{tracked.orderId}</strong> •
                  Customer: <strong className="text-stone-700">{tracked.customerName}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="block text-[11px] font-bold uppercase text-stone-400">
                    {t('courierPartnerLabel')}
                  </span>
                  <span className="font-bold text-sm text-stone-900">
                    🚚 {tracked.courierName || 'Delhivery Express'}
                  </span>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="block text-[11px] font-bold uppercase text-amber-800">
                    {t('estimatedDeliveryLabel')}
                  </span>
                  <span className="font-extrabold text-sm text-amber-950">
                    📅 {tracked.estimatedDelivery || 'Within 3–4 Business Days'}
                  </span>
                </div>
                <Link
                  href={`/order/${tracked.orderId}/invoice`}
                  className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <span>🧾</span>
                  <span>GST Invoice</span>
                </Link>
              </div>
            </div>

            {/* 5-Stage Visual Progress Bar */}
            {tracked.fulfillmentStatus === 'CANCELLED' ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-sm text-center mb-6">
                ❌ This order was marked as CANCELLED.
              </div>
            ) : (
              <div className="py-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {STAGES.map((stage, index) => {
                    const isCompleted = currentStageIndex >= index;
                    const isCurrent = currentStageIndex === index;
                    return (
                      <div
                        key={stage.key}
                        className={`p-3.5 rounded-2xl border transition-all flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 ${
                          isCurrent
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                            : isCompleted
                              ? 'bg-stone-50 border-emerald-300'
                              : 'bg-white border-stone-200 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {isCompleted ? '✓' : stage.icon}
                        </div>
                        <div>
                          <p
                            className={`text-xs font-extrabold ${
                              isCompleted ? 'text-stone-900' : 'text-stone-400'
                            }`}
                          >
                            {t(stage.labelKey)}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {isCurrent
                              ? lang === 'hi'
                                ? 'वर्तमान स्थिति'
                                : 'Current Stage'
                              : isCompleted
                                ? lang === 'hi'
                                  ? 'पूर्ण'
                                  : 'Completed'
                                : lang === 'hi'
                                  ? 'आगामी'
                                  : 'Upcoming'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity Timeline + Order Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-4 border-t border-stone-200">
              {/* Shipment Timeline */}
              <div className="lg:col-span-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-500 mb-4">
                  📍 {lang === 'hi' ? 'शिपमेंट टाइमलाइन (एडमिन अपडेट्स)' : 'Live Shipment Activity Log'}
                </h3>
                <div className="space-y-4">
                  {[...(tracked.trackingHistory || [])].reverse().map((ev, idx) => (
                    <div
                      key={`${ev.timestamp}-${idx}`}
                      className="relative pl-6 pb-4 border-l-2 border-emerald-500 last:border-l-transparent"
                    >
                      <span
                        className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                          idx === 0 ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-stone-400'
                        }`}
                      />
                      <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-stone-900 text-sm">{ev.title}</span>
                          <span className="text-[11px] font-mono text-stone-500">
                            {new Date(ev.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-rose-800 mb-1">
                          📍 {ev.location}
                        </p>
                        <p className="text-xs text-stone-600 leading-relaxed">{ev.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items & Address */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-2">
                    🏠 {lang === 'hi' ? 'डिलीवरी का पता' : 'Delivery Destination'}
                  </h3>
                  <p className="text-sm font-bold text-stone-900">{tracked.customerName}</p>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{tracked.address}</p>
                  <p className="text-xs text-stone-500 mt-1 font-mono">📞 {tracked.phone}</p>
                </div>

                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 mb-3">
                    🛍️ {lang === 'hi' ? 'ऑर्डर किए गए आइटम' : 'Package Contents'}
                  </h3>
                  <div className="space-y-2.5">
                    {(tracked.items || []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs gap-2">
                        <span className="text-stone-700 font-medium">
                          {lang === 'hi' && item.name_hi ? item.name_hi : item.name} ({item.size}) ×{' '}
                          {item.qty}
                        </span>
                        <span className="font-bold text-stone-900">
                          {rupees(item.line_total_paise || item.price_paise * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {tracked.discountPaise && tracked.discountPaise > 0 ? (
                    <div className="mt-2 pt-2 border-t border-stone-200 flex justify-between text-xs font-bold text-emerald-700">
                      <span>Discount ({tracked.couponCode})</span>
                      <span>− {rupees(tracked.discountPaise)}</span>
                    </div>
                  ) : null}
                  <div className="mt-3 pt-3 border-t border-stone-200 flex justify-between text-sm font-extrabold text-stone-900">
                    <span>{t('totalPayable')}</span>
                    <span className="text-rose-900">{rupees(tracked.amountPaise)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                  <p className="font-bold mb-1">
                    💡 {lang === 'hi' ? 'एडमिन से लाइव अपडेट टेस्ट करें:' : 'Want to test Admin updates?'}
                  </p>
                  <p className="mb-2">
                    {lang === 'hi'
                      ? 'एडमिन डैशबोर्ड (/admin) में जाकर इस ऑर्डर का स्टेटस बदलें और यहाँ तुरंत बदलाव देखें।'
                      : 'Open the Admin Console (/admin), change this order’s fulfillment stage, and watch it update here immediately.'}
                  </p>
                  <Link
                    href="/admin"
                    className="inline-block font-extrabold text-rose-800 hover:underline"
                  >
                    Open Admin Console (/admin) →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />
      <Suspense
        fallback={
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 text-center text-stone-500">
            Loading live shipment tracker...
          </main>
        }
      >
        <TrackOrderContent />
      </Suspense>
      <Footer />
    </div>
  );
}
