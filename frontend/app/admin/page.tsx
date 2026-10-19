'use client';
import { useState } from 'react';
import { API_URL, rupees, useT } from '../../lib/store';

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
  const [token, setToken] = useState('');
  const [target, setTarget] = useState('');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [msg, setMsg] = useState('');
  const [loaded, setLoaded] = useState(false);

  const headers = { 'Content-Type': 'application/json', 'x-admin-token': token };

  async function load() {
    setMsg('');
    const [a, b] = await Promise.all([
      fetch(`${API_URL}/api/admin/notification-target`, { headers }),
      fetch(`${API_URL}/api/admin/orders`, { headers }),
    ]);
    if (!a.ok || !b.ok) {
      setMsg('Unauthorized');
      setLoaded(false);
      return;
    }
    setTarget((await a.json()).target || '');
    setOrders((await b.json()).orders);
    setLoaded(true);
  }

  async function save() {
    const res = await fetch(`${API_URL}/api/admin/notification-target`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ target }),
    });
    setMsg(res.ok ? t('saved') : t('errorGeneric'));
  }

  const input = 'border rounded-lg px-3 py-2 bg-white';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('admin')}</h1>
      <div className="flex gap-2">
        <input type="password" className={`${input} flex-1`} placeholder={t('adminToken')} value={token}
          onChange={(e) => setToken(e.target.value)} />
        <button onClick={load} className="bg-brand text-white rounded-lg px-4">{t('login')}</button>
      </div>
      {msg && <p className="text-sm text-gray-700">{msg}</p>}

      {loaded && (
        <>
          <div className="bg-white border rounded-2xl p-4 space-y-2">
            <label className="text-sm font-medium">{t('notifyTarget')}</label>
            <div className="flex gap-2">
              <input className={`${input} flex-1`} value={target} onChange={(e) => setTarget(e.target.value)} />
              <button onClick={save} className="bg-brand text-white rounded-lg px-4">{t('save')}</button>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4">
            <h2 className="font-semibold mb-2">{t('orders')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1">ID</th><th>Name</th><th>Phone</th><th>Amount</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.order_id} className="border-t">
                      <td className="py-1 font-mono text-xs">{o.order_id}</td>
                      <td>{o.customer_name}</td>
                      <td>{o.phone}</td>
                      <td>{rupees(o.amount_paise)}</td>
                      <td>{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
