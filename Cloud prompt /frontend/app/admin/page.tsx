'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { API_URL, Product, rupees, useT } from '../../lib/store';

type AdminOrder = {
  order_id: string;
  customer_name: string;
  phone: string;
  address?: string;
  amount_paise: number;
  status: string;
  tracking_id?: string | null;
  courier_name?: string;
  fulfillment_status?: string;
  estimated_delivery?: string | null;
  created_at: string;
};

const FULFILLMENT_OPTIONS = [
  { value: 'ORDER_PLACED', label: '1. ORDER_PLACED (Order Confirmed)' },
  { value: 'PACKED', label: '2. PACKED (Packed at Jaipur Warehouse)' },
  { value: 'SHIPPED', label: '3. SHIPPED (Dispatched with Courier)' },
  { value: 'OUT_FOR_DELIVERY', label: '4. OUT_FOR_DELIVERY (Out for Delivery)' },
  { value: 'DELIVERED', label: '5. DELIVERED (Delivered to Customer)' },
  { value: 'CANCELLED', label: 'CANCELLED (Shipment Cancelled)' },
];

export default function AdminPage() {
  const { t } = useT();
  const [token, setToken] = useState('dev_admin_token_replace_me_123456');
  const [target, setTarget] = useState('');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [msg, setMsg] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Tracking Editor Modal / Panel State
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    fulfillmentStatus: 'PACKED',
    courierName: 'Delhivery Express',
    trackingId: '',
    estimatedDelivery: '',
    location: 'Jaipur Sitapura Dispatch Hub',
    note: '',
  });
  const [savingTracking, setSavingTracking] = useState(false);

  const headers = { 'Content-Type': 'application/json', 'x-admin-token': token };

  async function load(e?: FormEvent) {
    if (e) e.preventDefault();
    setMsg('');
    try {
      const [a, b] = await Promise.all([
        fetch(`${API_URL}/api/admin/notification-target`, { headers, cache: 'no-store' }),
        fetch(`${API_URL}/api/admin/orders`, { headers, cache: 'no-store' }),
      ]);
      if (!a.ok || !b.ok) {
        setMsg('Unauthorized — check x-admin-token');
        setLoaded(false);
        return;
      }
      const targetData = await a.json();
      const ordersData = await b.json();
      setTarget(targetData.target || '');
      setOrders(ordersData.orders || []);
      if (Array.isArray(ordersData.products)) {
        setProducts(ordersData.products);
      }
      setLoaded(true);
    } catch {
      setMsg(t('errorGeneric'));
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/admin/notification-target`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ target }),
    });
    setMsg(res.ok ? t('saved') : t('errorGeneric'));
  }

  function openTrackingEditor(order: AdminOrder) {
    setEditingOrder(order);
    setTrackingForm({
      fulfillmentStatus: order.fulfillment_status && order.fulfillment_status !== 'PENDING_PAYMENT'
        ? order.fulfillment_status
        : 'PACKED',
      courierName: order.courier_name || 'Delhivery Express',
      trackingId: order.tracking_id || `TRK-KC-${order.order_id.slice(-6)}`,
      estimatedDelivery: order.estimated_delivery || '23 Oct 2026',
      location: 'Jaipur Fulfillment Hub, Rajasthan',
      note: '',
    });
  }

  async function handleSaveTracking(e: FormEvent) {
    e.preventDefault();
    if (!editingOrder) return;
    setSavingTracking(true);
    setMsg('');
    try {
      const res = await fetch(
        `${API_URL}/api/admin/orders/${encodeURIComponent(editingOrder.order_id)}/tracking`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(trackingForm),
        }
      );
      if (res.ok) {
        setMsg(`${t('trackingUpdatedMsg')} (${trackingForm.trackingId} → ${trackingForm.fulfillmentStatus})`);
        setEditingOrder(null);
        await load();
      } else {
        setMsg(t('errorGeneric'));
      }
    } finally {
      setSavingTracking(false);
    }
  }

  const filteredOrders = orders.filter((o) =>
    statusFilter === 'ALL' ? true : o.status === statusFilter
  );

  const confirmedRevenue = orders
    .filter((o) => o.status === 'CONFIRMED')
    .reduce((s, o) => s + o.amount_paise, 0);

  const input =
    'border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-white focus:border-brand focus:outline-none';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{t('admin')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('adminSubtitle')}</p>
      </div>

      <form
        onSubmit={load}
        className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm"
      >
        <label htmlFor="admin-token-input" className="sr-only">
          {t('adminToken')}
        </label>
        <input
          id="admin-token-input"
          type="password"
          className={`${input} flex-1`}
          placeholder={t('adminToken')}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button
          type="submit"
          className="bg-brand text-white font-semibold text-sm rounded-xl px-5 py-2.5 hover:bg-brand-dark"
        >
          {t('login')}
        </button>
      </form>

      {msg && (
        <div
          role="status"
          className="text-sm font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3"
        >
          ✓ {msg}
        </div>
      )}

      {loaded && (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase text-gray-400">Total Orders</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{orders.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase text-gray-400">Confirmed Revenue</p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">{rupees(confirmedRevenue)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase text-gray-400">Active Tracking IDs</p>
              <p className="text-2xl font-extrabold text-brand mt-1">
                {orders.filter((o) => Boolean(o.tracking_id)).length}
              </p>
            </div>
          </div>

          {/* Live Tracking Editor Panel (when Admin clicks Update Tracking on an order) */}
          {editingOrder && (
            <form
              onSubmit={handleSaveTracking}
              className="bg-pink-50/80 border-2 border-brand rounded-3xl p-6 space-y-4 shadow-md"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    🚚 {t('adminTrackingModalTitle')}
                  </h2>
                  <p className="text-xs text-gray-600 font-mono">
                    Order: {editingOrder.order_id} • Customer: {editingOrder.customer_name} ({editingOrder.phone})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-1 rounded-lg border bg-white"
                >
                  ✕ Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-gray-700">
                    {t('fulfillmentStageLabel')} *
                  </label>
                  <select
                    value={trackingForm.fulfillmentStatus}
                    onChange={(e) => setTrackingForm({ ...trackingForm, fulfillmentStatus: e.target.value })}
                    className={`${input} w-full font-semibold`}
                  >
                    {FULFILLMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-gray-700">
                    Tracking ID / AWB *
                  </label>
                  <input
                    required
                    value={trackingForm.trackingId}
                    onChange={(e) => setTrackingForm({ ...trackingForm, trackingId: e.target.value.toUpperCase() })}
                    className={`${input} w-full font-mono`}
                    placeholder="TRK-KC-..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-gray-700">
                    {t('courierPartner')}
                  </label>
                  <input
                    value={trackingForm.courierName}
                    onChange={(e) => setTrackingForm({ ...trackingForm, courierName: e.target.value })}
                    className={`${input} w-full`}
                    placeholder="Delhivery Express / BlueDart / DTDC"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-gray-700">
                    {t('estimatedDelivery')}
                  </label>
                  <input
                    value={trackingForm.estimatedDelivery}
                    onChange={(e) => setTrackingForm({ ...trackingForm, estimatedDelivery: e.target.value })}
                    className={`${input} w-full`}
                    placeholder="e.g. 23 Oct 2026"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-gray-700">
                    {t('locationHubLabel')}
                  </label>
                  <input
                    value={trackingForm.location}
                    onChange={(e) => setTrackingForm({ ...trackingForm, location: e.target.value })}
                    className={`${input} w-full`}
                    placeholder="e.g. Jaipur Regional Sorting Hub"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-gray-700">
                    {t('trackingNoteLabel')}
                  </label>
                  <input
                    value={trackingForm.note}
                    onChange={(e) => setTrackingForm({ ...trackingForm, note: e.target.value })}
                    className={`${input} w-full`}
                    placeholder="e.g. Handed over to courier executive"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingTracking}
                  className="bg-brand text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-brand-dark disabled:opacity-50"
                >
                  {savingTracking ? 'Saving...' : `💾 ${t('saveTrackingBtn')}`}
                </button>
              </div>
            </form>
          )}

          {/* Orders & Tracking Table */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-bold text-lg text-gray-900">{t('orders')}</h2>
              <div className="flex gap-1.5 flex-wrap">
                {['ALL', 'PENDING', 'CONFIRMED', 'EXPIRED', 'FAILED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      statusFilter === st ? 'bg-brand text-white border-brand' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">{t('noOrdersYet')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-3">Order ID</th>
                      <th className="py-2 pr-3">Tracking ID</th>
                      <th className="py-2 pr-3">Customer</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2 pr-3">Payment</th>
                      <th className="py-2 pr-3">Shipment Stage</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.order_id} className="border-b last:border-b-0">
                        <td className="py-3 pr-3 font-mono text-xs">{o.order_id}</td>
                        <td className="py-3 pr-3 font-mono text-xs font-bold text-brand">
                          {o.tracking_id ? (
                            <Link href={`/track?id=${encodeURIComponent(o.tracking_id)}`} className="hover:underline">
                              {o.tracking_id}
                            </Link>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-medium text-gray-900">{o.customer_name}</p>
                          <p className="text-xs text-gray-500">{o.phone}</p>
                        </td>
                        <td className="py-3 pr-3 font-bold">{rupees(o.amount_paise)}</td>
                        <td className="py-3 pr-3">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              o.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="text-xs font-semibold bg-pink-50 text-brand border border-pink-200 px-2.5 py-0.5 rounded-full">
                            {o.fulfillment_status || 'PENDING_PAYMENT'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => openTrackingEditor(o)}
                            className="text-xs font-bold bg-brand text-white px-3 py-1.5 rounded-lg hover:bg-brand-dark whitespace-nowrap"
                          >
                            🚚 {t('updateTrackingBtn')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dynamic Telegram Target Configuration */}
          <form onSubmit={save} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <div>
              <label htmlFor="telegram-target" className="block text-sm font-bold text-gray-900">
                {t('notifyTarget')}
              </label>
              <p className="text-xs text-gray-500">{t('notifyHint')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="telegram-target"
                className={`${input} flex-1`}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                minLength={3}
              />
              <button
                type="submit"
                className="bg-brand text-white font-semibold text-sm rounded-xl px-5 py-2.5 hover:bg-brand-dark"
              >
                {t('save')}
              </button>
            </div>
          </form>

          {/* Inventory Overview */}
          {products.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
              <h2 className="font-bold text-lg text-gray-900">{t('inventoryTab')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {products.map((p) => (
                  <div key={p.id} className="border rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-gray-500">{rupees(p.price_paise)}</p>
                    </div>
                    <span
                      className={`font-bold px-2.5 py-1 rounded-full ${
                        p.stock === 0
                          ? 'bg-red-100 text-red-700'
                          : p.stock <= 10
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Stock: {p.stock}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
