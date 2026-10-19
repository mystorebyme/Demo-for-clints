'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL, rupees, useT } from '../../lib/store';

type TrackingEvent = {
  status: string;
  title: string;
  location: string;
  note: string;
  timestamp: string;
};

type TrackedOrderData = {
  orderId: string;
  trackingId: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  courierName: string;
  estimatedDelivery: string | null;
  trackingHistory: TrackingEvent[];
  customerName: string;
  address: string;
  amountPaise: number;
  items: Array<{ id: number; name: string; name_hi?: string | null; size?: string; qty: number; price_paise: number }>;
  createdAt: string;
  confirmedAt: string | null;
};

const STAGES = [
  { key: 'ORDER_PLACED', labelKey: 'stageOrderPlaced', icon: '🧾' },
  { key: 'PACKED', labelKey: 'stagePacked', icon: '📦' },
  { key: 'SHIPPED', labelKey: 'stageShipped', icon: '🚚' },
  { key: 'OUT_FOR_DELIVERY', labelKey: 'stageOutForDelivery', icon: '🛵' },
  { key: 'DELIVERED', labelKey: 'stageDelivered', icon: '🏡' },
] as const;

export default function TrackOrderPage() {
  const { t, lang } = useT();
  const [queryId, setQueryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<TrackedOrderData | null>(null);

  const fetchTracking = useCallback(async (idToFetch: string) => {
    const clean = idToFetch.trim();
    if (!clean) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/track/${encodeURIComponent(clean)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'No order found with this Tracking ID or Order ID.');
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const paramId = new URLSearchParams(window.location.search).get('id');
    if (paramId) {
      setQueryId(paramId);
      fetchTracking(paramId);
    }
  }, [fetchTracking]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    fetchTracking(queryId);
  }

  const currentStageIndex = data
    ? STAGES.findIndex((s) => s.key === data.fulfillmentStatus)
    : -1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Search Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            📦 {t('trackPageTitle')}
          </h1>
          <p className="text-sm text-gray-500">{t('trackPageSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="tracking-search-input" className="sr-only">
            {t('trackInputPlaceholder')}
          </label>
          <input
            id="tracking-search-input"
            type="text"
            required
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            placeholder={t('trackInputPlaceholder')}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono uppercase bg-gray-50/50 focus:bg-white focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-brand text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {loading ? t('refreshing') : `🔍 ${t('trackBtn')}`}
          </button>
        </form>

        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setQueryId('TRK-KC-1001');
              fetchTracking('TRK-KC-1001');
            }}
            className="text-brand font-semibold hover:underline"
          >
            ✨ {t('tryDemoTrack')}
          </button>

          {data && (
            <button
              type="button"
              onClick={() => fetchTracking(data.trackingId || data.orderId)}
              className="text-gray-600 font-semibold hover:text-brand"
            >
              ↻ {t('refreshStatus')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Tracking Result Card */}
      {data && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Top Summary Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-pink-50 text-brand border border-pink-200 px-3 py-0.5 rounded-full">
                  {data.trackingId || 'PENDING TRACKING ID'}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                    data.paymentStatus === 'CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Payment: {data.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono pt-1">
                {t('orderId')}: <strong>{data.orderId}</strong> • Customer: <strong>{data.customerName}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <p className="text-xs text-gray-500">
                {t('courierPartner')}: <strong className="text-gray-900">{data.courierName}</strong>
              </p>
              {data.estimatedDelivery && (
                <p className="text-xs text-emerald-700 font-bold">
                  {t('estimatedDelivery')}: {data.estimatedDelivery}
                </p>
              )}
              <p className="text-lg font-extrabold text-brand">{rupees(data.amountPaise)}</p>
            </div>
          </div>

          {/* 5-Stage Visual Shipment Progress Stepper */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              {t('shipmentTimeline')}
            </h2>

            {data.fulfillmentStatus === 'CANCELLED' ? (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-bold text-sm">
                🚫 Shipment Cancelled
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {STAGES.map((stage, idx) => {
                  const done = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;
                  return (
                    <div
                      key={stage.key}
                      className={`p-3 rounded-2xl border text-center space-y-1 transition-all ${
                        isCurrent
                          ? 'bg-brand text-white border-brand shadow-sm ring-2 ring-brand/20'
                          : done
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}
                    >
                      <div className="text-xl" aria-hidden="true">
                        {stage.icon}
                      </div>
                      <p className="text-xs font-bold leading-snug">{t(stage.labelKey)}</p>
                      <p className="text-[10px] font-semibold opacity-80">
                        {done ? '✓ Completed' : 'Pending'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Activity Timeline (Admin Updates) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-gray-900">
              Tracking Activity Log ({data.trackingHistory?.length || 0} updates)
            </h3>

            {!data.trackingHistory || data.trackingHistory.length === 0 ? (
              <p className="text-xs text-gray-500">
                Awaiting payment confirmation to generate first shipment milestone.
              </p>
            ) : (
              <ol className="relative border-l-2 border-pink-200 ml-3 space-y-4 py-1">
                {[...data.trackingHistory].reverse().map((ev, idx) => (
                  <li key={`${ev.timestamp}-${idx}`} className="ml-5 space-y-1">
                    <span
                      className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 border-white ${
                        idx === 0 ? 'bg-brand ring-2 ring-brand/20' : 'bg-emerald-500'
                      }`}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="text-sm font-bold text-gray-900">{ev.title}</p>
                      <time className="text-xs font-mono text-gray-400">
                        {new Date(ev.timestamp).toLocaleString('en-IN')}
                      </time>
                    </div>
                    <p className="text-xs font-semibold text-brand">📍 {ev.location}</p>
                    <p className="text-xs text-gray-600">{ev.note}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Delivery Address & Items */}
          <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
              <p className="font-bold text-gray-900 uppercase">Delivery Address</p>
              <p className="text-gray-700 font-medium">{data.customerName}</p>
              <p className="text-gray-600">{data.address}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5">
              <p className="font-bold text-gray-900 uppercase">{t('orderSummary')}</p>
              {data.items.map((it, idx) => (
                <div key={`${it.id}-${idx}`} className="flex justify-between text-gray-700">
                  <span>
                    {lang === 'hi' && it.name_hi ? it.name_hi : it.name}{' '}
                    {it.size ? `(${it.size})` : ''} × {it.qty}
                  </span>
                  <span className="font-bold">{rupees(it.price_paise * it.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs">
            <Link href="/" className="text-brand font-semibold hover:underline">
              ← {t('continueShopping')}
            </Link>
            <Link href={`/order/${data.orderId}`} className="text-gray-500 hover:text-brand underline">
              View Order Receipt ({data.orderId})
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
