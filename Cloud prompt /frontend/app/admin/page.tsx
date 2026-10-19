'use client';
import { FormEvent, useState } from 'react';
import { API_URL, Product, rupees, useT } from '../../lib/store';

type AdminOrder = {
  order_id: string;
  customer_name: string;
  phone: string;
  amount_paise: number;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const { t } = useT();
  const [token, setToken] = useState('dev_admin_token_replace_me_123456');
  const [target, setTarget] = useState('');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [msg, setMsg] = useState('');
  const [loaded, setLoaded] = useState(false);

  const headers = { 'Content-Type': 'application/json', 'x-admin-token': token };

  async function load(e?: FormEvent) {
    if (e) e.preventDefault();
    setMsg('');
    try {
      const [a, b] = await Promise.all([
        fetch(`${API_URL}/api/admin/notification-target`, { headers }),
        fetch(`${API_URL}/api/admin/orders`, { headers }),
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

  const filteredOrders = orders.filter((o) =>
    statusFilter === 'ALL' ? true : o.status === statusFilter
  );

  const confirmedRevenue = orders
    .filter((o) => o.status === 'CONFIRMED')
    .reduce((s, o) => s + o.amount_paise, 0);

  const input = 'border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-white focus:border-brand focus:outline-none';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{t('admin')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('adminSubtitle')}</p>
      </div>

      <form onSubmit={load} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
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
        <div role="status" className="text-sm font-medium bg-pink-50 border border-pink-200 text-brand-dark rounded-xl px-4 py-2.5">
          {msg}
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
              <p className="text-xs font-bold uppercase text-gray-400">Pending Verification</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {orders.filter((o) => o.status === 'PENDING').length}
              </p>
            </div>
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

          {/* Orders Table */}
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
                      <th className="py-2 pr-3">Customer</th>
                      <th className="py-2 pr-3">Phone</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.order_id} className="border-b last:border-b-0">
                        <td className="py-2.5 pr-3 font-mono text-xs">{o.order_id}</td>
                        <td className="py-2.5 pr-3 font-medium">{o.customer_name}</td>
                        <td className="py-2.5 pr-3">{o.phone}</td>
                        <td className="py-2.5 pr-3 font-bold">{rupees(o.amount_paise)}</td>
                        <td className="py-2.5">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
