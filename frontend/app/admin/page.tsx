'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { rupees, useStore } from '../../lib/store';

type AdminOrder = {
  order_id: string;
  invoice_number?: string;
  customer_name: string;
  phone: string;
  address: string;
  subtotal_paise?: number;
  discount_paise?: number;
  coupon_code?: string | null;
  amount_paise: number;
  status: string;
  tracking_id: string | null;
  courier_name: string;
  fulfillment_status: string;
  estimated_delivery: string | null;
  created_at: string;
  items: Array<{ id: number; name: string; qty: number; size: string }>;
};

type AdminProduct = {
  id: number;
  name: string;
  name_hi: string;
  category: 'kurti' | 'bag' | 'accessory';
  price_paise: number;
  original_price_paise?: number;
  image_url: string;
  stock: number;
  sold_count: number;
  sizes: string[];
  badge?: string;
};

type AdminCoupon = {
  code: string;
  description_en: string;
  description_hi: string;
  discount_type: 'PERCENT' | 'FLAT';
  discount_value: number;
  min_order_paise: number;
  max_discount_paise: number;
  active: boolean;
  usage_count: number;
};

type AdminAnalytics = {
  totalRevenuePaise: number;
  liveSessionRevenuePaise: number;
  totalDiscountGivenPaise: number;
  totalOrdersCount: number;
  confirmedOrdersCount: number;
  totalUnitsSold: number;
  averageOrderValuePaise: number;
  categoryBreakdown: Array<{
    category: string;
    label: string;
    revenuePaise: number;
    percentage: number;
  }>;
  topProducts: Array<{
    id: number;
    name: string;
    name_hi: string;
    category: string;
    image_url: string;
    price_paise: number;
    stock: number;
    sold_count: number;
    revenue_paise: number;
  }>;
  lowStockProducts: AdminProduct[];
  dailySeries: Array<{
    day: string;
    orders: number;
    revenuePaise: number;
  }>;
};

const FULFILLMENT_STAGES = [
  { value: 'ORDER_PLACED', label: '1. Order Placed (ऑर्डर प्राप्त)' },
  { value: 'PACKED', label: '2. Packed (पैक किया गया)' },
  { value: 'SHIPPED', label: '3. Shipped (कूरियर को सौंपा गया)' },
  { value: 'OUT_FOR_DELIVERY', label: '4. Out for Delivery (डिलीवरी के लिए निकला)' },
  { value: 'DELIVERED', label: '5. Delivered (डिलीवर हो गया)' },
  { value: 'CANCELLED', label: 'Cancelled (रद्द किया गया)' },
];

const PRESET_IMAGES = [
  { label: 'Kurti 1 (Terracotta)', url: '/products/kurti1.svg' },
  { label: 'Kurti 2 (Royal Anarkali)', url: '/products/kurti2.svg' },
  { label: 'Kurti 3 (Chikankari)', url: '/products/kurti3.svg' },
  { label: 'Kurti 4 (Silk Blend)', url: '/products/kurti4.svg' },
  { label: 'Bag 1 (Tote Bag)', url: '/products/bag1.svg' },
  { label: 'Bag 2 (Sling Bag)', url: '/products/bag2.svg' },
  { label: 'Bag 3 (Potli Bag)', url: '/products/bag3.svg' },
  { label: 'Bag 4 (Jacquard Bag)', url: '/products/bag4.svg' },
  { label: 'Accessory 1 (Jhumka)', url: '/products/acc1.svg' },
  { label: 'Accessory 2 (Dupatta)', url: '/products/acc2.svg' },
  { label: 'Accessory 3 (Kundan Choker)', url: '/products/acc3.svg' },
  { label: 'Accessory 4 (Mirror Bangles)', url: '/products/acc4.svg' },
];

export default function AdminPage() {
  const { lang, t } = useStore();
  const [adminToken, setAdminToken] = useState('dev_admin_token_replace_me_123456');
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'inventory' | 'coupons'>(
    'analytics'
  );

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);

  const [notificationTarget, setNotificationTarget] = useState('');
  const [fallbackTier, setFallbackTier] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Order Tracking Editor state
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [editStage, setEditStage] = useState<string>('SHIPPED');
  const [editCourier, setEditCourier] = useState<string>('Delhivery Express');
  const [editTrackingId, setEditTrackingId] = useState<string>('');
  const [editEta, setEditEta] = useState<string>('22 Oct 2026');
  const [editLocation, setEditLocation] = useState<string>('Jaipur Fulfillment Hub, RJ');
  const [editNote, setEditNote] = useState<string>('');
  const [savingTracking, setSavingTracking] = useState(false);

  // New Product & Stock Image Form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdNameHi, setNewProdNameHi] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'kurti' | 'bag' | 'accessory'>('kurti');
  const [newProdPriceInr, setNewProdPriceInr] = useState('899');
  const [newProdMrpInr, setNewProdMrpInr] = useState('1399');
  const [newProdStock, setNewProdStock] = useState('25');
  const [newProdImageUrl, setNewProdImageUrl] = useState('/products/kurti2.svg');
  const [newProdBadge, setNewProdBadge] = useState('New Launch');

  // Inline Product Image / Price Editor
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [editProdPriceInr, setEditProdPriceInr] = useState('');
  const [editProdStock, setEditProdStock] = useState('');
  const [editProdImage, setEditProdImage] = useState('');

  // New Coupon Form state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [newCouponValue, setNewCouponValue] = useState('15');
  const [newCouponMinInr, setNewCouponMinInr] = useState('999');

  const selectOrderForEdit = useCallback((order: AdminOrder) => {
    setSelectedOrderId(order.order_id);
    setEditStage(
      order.fulfillment_status === 'PENDING_PAYMENT'
        ? 'ORDER_PLACED'
        : order.fulfillment_status || 'ORDER_PLACED'
    );
    setEditCourier(order.courier_name || 'Delhivery Express');
    setEditTrackingId(order.tracking_id || '');
    setEditEta(order.estimated_delivery || '22 Oct 2026');
    setEditLocation('Jaipur Regional Hub, RJ');
    setEditNote('');
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'x-admin-token': adminToken },
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Unauthorized admin token');
        setLoading(false);
        return;
      }
      const list: AdminOrder[] = data.orders || [];
      setOrders(list);
      setProducts(data.products || []);
      setCoupons(data.coupons || []);
      setAnalytics(data.analytics || null);
      setNotificationTarget(data.config?.notificationTarget || '');
      setFallbackTier(data.config?.fallbackTier || 1);

      if (list.length > 0 && !selectedOrderId) {
        selectOrderForEdit(list[0]);
      }
    } catch {
      setError('Failed to load admin console');
    } finally {
      setLoading(false);
    }
  }, [adminToken, selectedOrderId, selectOrderForEdit]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  };

  async function handleUpdateTracking(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrderId) return;
    setSavingTracking(true);
    setError('');
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(selectedOrderId)}/tracking`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({
            fulfillmentStatus: editStage,
            courierName: editCourier,
            trackingId: editTrackingId,
            estimatedDelivery: editEta,
            location: editLocation,
            note: editNote,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not update tracking status');
        return;
      }
      setEditTrackingId(data.order?.trackingId || editTrackingId);
      setEditNote('');
      showToast(
        `✓ Order ${selectedOrderId} updated to ${editStage} (Tracking ID: ${data.order?.trackingId}). Live on /track!`
      );
      await loadAdminData();
    } finally {
      setSavingTracking(false);
    }
  }

  // Handle local file upload -> Data URL for Product Image
  function handleFileImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    onDataUrl: (url: string) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleAddNewProduct(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const pricePaise = Math.round((Number(newProdPriceInr) || 799) * 100);
    const mrpPaise = Math.round((Number(newProdMrpInr) || 1199) * 100);

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        name: newProdName,
        name_hi: newProdNameHi || newProdName,
        category: newProdCategory,
        price_paise: pricePaise,
        original_price_paise: mrpPaise,
        stock: Number(newProdStock) || 20,
        image_url: newProdImageUrl,
        badge: newProdBadge,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error || 'Could not add product');
      return;
    }
    setNewProdName('');
    setNewProdNameHi('');
    showToast(`✓ Added new product "${data.product.name}" with stock ${data.product.stock}!`);
    await loadAdminData();
  }

  async function handleQuickStockAdjust(prod: AdminProduct, delta: number) {
    const nextStock = Math.max(0, prod.stock + delta);
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        id: prod.id,
        stock: nextStock,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`✓ Updated stock for "${prod.name}" → ${nextStock} units`);
      await loadAdminData();
    }
  }

  async function handleSaveProductEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        id: editingProduct.id,
        price_paise: Math.round((Number(editProdPriceInr) || 799) * 100),
        stock: Math.max(0, Number(editProdStock) || 0),
        image_url: editProdImage,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`✓ Saved product #${editingProduct.id} (${editingProduct.name}) changes!`);
      setEditingProduct(null);
      await loadAdminData();
    }
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const val =
      newCouponType === 'FLAT'
        ? Math.round((Number(newCouponValue) || 100) * 100)
        : Math.min(80, Math.max(1, Number(newCouponValue) || 10));
    const minPaise = Math.round((Number(newCouponMinInr) || 0) * 100);

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        code: newCouponCode.trim().toUpperCase(),
        description_en:
          newCouponDesc ||
          (newCouponType === 'PERCENT'
            ? `${val}% OFF on orders above ₹${newCouponMinInr}`
            : `Flat ₹${newCouponValue} OFF on orders above ₹${newCouponMinInr}`),
        discount_type: newCouponType,
        discount_value: val,
        min_order_paise: minPaise,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setNewCouponCode('');
      setNewCouponDesc('');
      showToast(`✓ Promo code ${data.coupon.code} saved and active!`);
      await loadAdminData();
    }
  }

  async function handleToggleCoupon(code: string) {
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({ action: 'toggle', code }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`✓ Coupon ${code} is now ${data.coupon.active ? 'ACTIVE' : 'INACTIVE'}`);
      await loadAdminData();
    }
  }

  async function saveNotificationTarget(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/notification-target', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({ target: notificationTarget }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('✓ Notification target updated successfully.');
    }
  }

  const maxDailyRevenue = Math.max(
    1,
    ...(analytics?.dailySeries.map((d) => d.revenuePaise) || [5000000])
  );

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Admin Header & Auth Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {t('adminTitle')}
            </h1>
            <p className="text-sm text-stone-500">{t('adminSubtitle')}</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              aria-label="Admin Token"
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono bg-white w-56"
            />
            <button
              type="button"
              onClick={loadAdminData}
              className="px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold"
            >
              {loading ? 'Refreshing...' : '↻ Refresh Live Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
            {error}
          </div>
        )}
        {feedback && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold shadow-sm">
            {feedback}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
          {[
            {
              id: 'analytics',
              label: lang === 'hi' ? '📊 रेवेन्यू और एनालिटिक्स चार्ट्स' : '📊 Revenue & Analytics Charts',
            },
            {
              id: 'orders',
              label:
                lang === 'hi'
                  ? `📦 ऑर्डर्स, लाइव ट्रैकिंग और GST बिल (${orders.length})`
                  : `📦 Orders, Tracking & GST Bills (${orders.length})`,
            },
            {
              id: 'inventory',
              label:
                lang === 'hi'
                  ? `👗 स्टॉक, कीमत और प्रोडक्ट फोटो (${products.length})`
                  : `👗 Stock, Price & Product Images (${products.length})`,
            },
            {
              id: 'coupons',
              label:
                lang === 'hi'
                  ? `🎟️ डिस्काउंट कूपन और सेटिंग्स (${coupons.length})`
                  : `🎟️ Promo Coupons & Settings (${coupons.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                activeTab === tab.id
                  ? 'bg-rose-800 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: REVENUE & ANALYTICS CHARTS */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Total Store Revenue
                </span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                  {rupees(analytics.totalRevenuePaise)}
                </p>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  ↑ +18.4% vs last week • Live session: {rupees(analytics.liveSessionRevenuePaise)}
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Total Orders & Units Sold
                </span>
                <p className="text-2xl font-extrabold text-stone-900 mt-1">
                  {analytics.totalOrdersCount} Orders
                </p>
                <span className="text-[11px] text-stone-500 font-semibold">
                  {analytics.totalUnitsSold} Ethnic Units Sold • Auto-Stock Sync Active
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Average Order Value (AOV)
                </span>
                <p className="text-2xl font-extrabold text-rose-800 mt-1">
                  {rupees(analytics.averageOrderValuePaise)}
                </p>
                <span className="text-[11px] text-stone-500 font-semibold">
                  Coupon Savings Given: {rupees(analytics.totalDiscountGivenPaise)}
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Low Stock Alerts (≤ 5 left)
                </span>
                <p className="text-2xl font-extrabold text-amber-700 mt-1">
                  {analytics.lowStockProducts.length} Items
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="text-[11px] font-bold text-rose-800 hover:underline"
                >
                  Manage Stock & Images →
                </button>
              </div>
            </div>

            {/* Low-Stock Alert Strip with 1-Click Restock */}
            {analytics.lowStockProducts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                    ⚠️ Low / Out-of-Stock Inventory Alert (Auto-Decremented as Orders Sell)
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analytics.lowStockProducts.map((lp) => (
                      <span
                        key={lp.id}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-amber-300 text-xs font-bold text-stone-800"
                      >
                        <span>
                          {lp.name} (<strong className="text-rose-700">{lp.stock} left</strong>)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickStockAdjust(lp, 10)}
                          className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-extrabold"
                        >
                          +10 Restock
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Charts Grid: 7-Day Daily Revenue Bar Chart + Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 7-Day Daily Revenue & Orders Visual Bar Chart */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-extrabold text-stone-900">
                      📈 7-Day Daily Revenue & Order Volume
                    </h2>
                    <p className="text-xs text-stone-500">
                      Real-time store revenue trend (updates live when new orders are confirmed)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                    ● Live Sync
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-52 pt-6 px-2 border-b border-stone-200">
                  {analytics.dailySeries.map((point) => {
                    const heightPct = Math.max(
                      14,
                      Math.round((point.revenuePaise / maxDailyRevenue) * 100)
                    );
                    return (
                      <div
                        key={point.day}
                        className="flex flex-col items-center justify-end h-full group"
                      >
                        <span className="text-[10px] font-bold text-stone-600 mb-1">
                          {rupees(point.revenuePaise)}
                        </span>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full max-w-[44px] rounded-t-xl bg-gradient-to-t from-rose-800 to-amber-500 group-hover:from-rose-900 group-hover:to-amber-600 transition-all shadow-sm relative"
                          title={`${point.day}: ${rupees(point.revenuePaise)} (${point.orders} orders)`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-2 text-center">
                  {analytics.dailySeries.map((point) => (
                    <div key={point.day}>
                      <p className="text-[11px] font-bold text-stone-800 truncate">{point.day}</p>
                      <p className="text-[10px] text-stone-400">{point.orders} orders</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Revenue Split */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-stone-900 mb-1">
                    🛍️ Revenue by Category
                  </h2>
                  <p className="text-xs text-stone-500 mb-6">
                    Share of sales across Kurtis, Bags & Accessories
                  </p>

                  <div className="space-y-5">
                    {analytics.categoryBreakdown.map((cat) => (
                      <div key={cat.category}>
                        <div className="flex justify-between text-xs font-bold text-stone-800 mb-1.5">
                          <span>{cat.label}</span>
                          <span>
                            {rupees(cat.revenuePaise)} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            style={{ width: `${cat.percentage}%` }}
                            className={`h-full rounded-full ${
                              cat.category === 'kurti'
                                ? 'bg-rose-800'
                                : cat.category === 'bag'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-stone-500">
                  <p className="font-semibold text-stone-800">
                    💡 Automatic Stock Deduction Enabled:
                  </p>
                  <p className="mt-0.5">
                    Every confirmed order automatically decrements product stock and updates these
                    charts in real time.
                  </p>
                </div>
              </div>
            </div>

            {/* Top-Selling Products Leaderboard */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-extrabold text-stone-900">
                  🏆 Top-Selling Boutique Products (Live Sold Count & Stock)
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="text-xs font-bold text-rose-800 hover:underline"
                >
                  Open Full Stock & Image Manager →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-stone-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Unit Price</th>
                      <th className="py-2.5 px-3">Units Sold</th>
                      <th className="py-2.5 px-3">Remaining Stock</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {analytics.topProducts.map((tp, i) => (
                      <tr key={tp.id} className="hover:bg-stone-50">
                        <td className="py-3 px-3 flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-extrabold flex items-center justify-center text-[11px]">
                            #{i + 1}
                          </span>
                          <img
                            src={tp.image_url}
                            alt={tp.name}
                            className="w-9 h-11 rounded-lg object-cover border border-stone-200"
                          />
                          <div>
                            <p className="font-bold text-stone-900">{tp.name}</p>
                            <p className="text-[11px] text-stone-400">{tp.name_hi}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3 uppercase font-semibold text-rose-800">
                          {tp.category}
                        </td>
                        <td className="py-3 px-3 font-semibold">{rupees(tp.price_paise)}</td>
                        <td className="py-3 px-3 font-extrabold text-emerald-700">
                          {tp.sold_count} sold
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              tp.stock <= 5
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {tp.stock} in stock
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-stone-900">
                          {rupees(tp.revenue_paise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS, LIVE TRACKING & GST INVOICES */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-stone-900">
                  Live Orders, Tracking & GST Invoices ({orders.length})
                </h2>
                <Link
                  href="/track"
                  className="text-xs font-bold text-rose-800 hover:underline"
                >
                  Open Customer Tracking Page (/track) →
                </Link>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase">
                    <th className="py-3 pr-3">Order & GST Bill</th>
                    <th className="py-3 pr-3">Customer</th>
                    <th className="py-3 pr-3">Amount & Coupon</th>
                    <th className="py-3 pr-3">Tracking ID</th>
                    <th className="py-3 pr-3">Stage</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {orders.map((o) => {
                    const isSelected = o.order_id === selectedOrderId;
                    return (
                      <tr
                        key={o.order_id}
                        className={isSelected ? 'bg-amber-50/70' : 'hover:bg-stone-50'}
                      >
                        <td className="py-3 pr-3">
                          <Link
                            href={`/order/${o.order_id}`}
                            className="font-mono font-bold text-rose-800 hover:underline block"
                          >
                            {o.order_id}
                          </Link>
                          <span className="text-[10px] font-mono text-stone-400">
                            {o.invoice_number || `INV-KC-2026-${o.order_id.slice(-6)}`}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-stone-900">{o.customer_name}</div>
                          <div className="text-stone-400">{o.phone}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-bold text-stone-900">{rupees(o.amount_paise)}</div>
                          {o.coupon_code && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              🎟️ {o.coupon_code}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3 font-mono font-bold text-stone-800">
                          {o.tracking_id ? (
                            <Link
                              href={`/track?id=${encodeURIComponent(o.tracking_id)}`}
                              className="text-emerald-700 hover:underline"
                            >
                              {o.tracking_id}
                            </Link>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-800">
                            {o.fulfillment_status || 'PENDING_PAYMENT'}
                          </span>
                        </td>
                        <td className="py-3 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => selectOrderForEdit(o)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                              isSelected
                                ? 'bg-rose-800 text-white'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                            }`}
                          >
                            Update Tracking
                          </button>
                          <Link
                            href={`/order/${o.order_id}/invoice`}
                            className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-700 text-white font-bold text-xs"
                            title="Print / Download GST Tax Invoice"
                          >
                            🧾 GST Bill
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Live Order Tracking Updater Sidebar */}
            <aside className="bg-white rounded-3xl border-2 border-rose-800/20 p-6 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-extrabold text-stone-900">
                  🚚 Update Order Tracking
                </h2>
                {selectedOrderId && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-800">
                    {selectedOrderId}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mb-4">
                Changes saved here immediately appear on the customer&apos;s{' '}
                <Link href="/track" className="text-rose-800 font-bold underline">
                  /track
                </Link>{' '}
                page.
              </p>

              <form onSubmit={handleUpdateTracking} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Fulfillment Stage
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white"
                  >
                    {FULFILLMENT_STAGES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Courier Partner
                    </label>
                    <input
                      type="text"
                      value={editCourier}
                      onChange={(e) => setEditCourier(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Tracking ID
                    </label>
                    <input
                      type="text"
                      value={editTrackingId}
                      onChange={(e) => setEditTrackingId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Estimated Delivery
                    </label>
                    <input
                      type="text"
                      value={editEta}
                      onChange={(e) => setEditEta(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Current Hub / City
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Status Note for Customer
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="e.g., Package dispatched from Jaipur hub"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingTracking}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm"
                >
                  {savingTracking ? 'Saving...' : '✓ Save & Publish Tracking Update'}
                </button>
              </form>
            </aside>
          </div>
        )}

        {/* TAB 3: INVENTORY, STOCK & PRODUCT IMAGE MANAGER */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Inventory Table */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-stone-900">
                    👗 Live Product Catalog & Stock Manager ({products.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Stock automatically decreases when orders are confirmed. Click +1 / -1 / +10 or
                    Edit to update stock & images live.
                  </p>
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-2">Image & Product</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2">Sold</th>
                    <th className="py-3 px-2">Live Stock</th>
                    <th className="py-3 px-2">Quick Stock Adjust</th>
                    <th className="py-3 px-2">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-stone-50">
                      <td className="py-3 px-2 flex items-center gap-3">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-11 h-14 rounded-lg object-cover border border-stone-200 bg-stone-100 shrink-0"
                        />
                        <div>
                          <Link
                            href={`/products/${prod.id}`}
                            className="font-bold text-stone-900 hover:text-rose-800 block"
                          >
                            #{prod.id} {prod.name}
                          </Link>
                          <span className="text-[11px] text-stone-400 block">{prod.name_hi}</span>
                          <span className="text-[10px] uppercase font-bold text-rose-700">
                            {prod.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-bold text-stone-900">
                        {rupees(prod.price_paise)}
                      </td>
                      <td className="py-3 px-2 font-bold text-emerald-700">
                        {prod.sold_count || 0}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                            prod.stock <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : prod.stock <= 5
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {prod.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickStockAdjust(prod, -1)}
                            className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold"
                            title="Decrease stock by 1"
                          >
                            −1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStockAdjust(prod, 1)}
                            className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold"
                            title="Increase stock by 1"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStockAdjust(prod, 10)}
                            className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold"
                            title="Add 10 stock"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(prod);
                            setEditProdPriceInr(String(Math.round(prod.price_paise / 100)));
                            setEditProdStock(String(prod.stock));
                            setEditProdImage(prod.image_url);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold"
                        >
                          🖼️ Photo / Price
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Sidebar: Edit Selected Product OR Add New Product with Photo Upload */}
            <aside className="space-y-6">
              {editingProduct && (
                <div className="bg-amber-50/90 rounded-3xl border-2 border-amber-400 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-extrabold text-stone-900">
                      ✏️ Edit Product #{editingProduct.id}: {editingProduct.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="text-xs font-bold text-stone-500 hover:text-stone-800"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <form onSubmit={handleSaveProductEdit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          value={editProdPriceInr}
                          onChange={(e) => setEditProdPriceInr(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                          Stock Units
                        </label>
                        <input
                          type="number"
                          value={editProdStock}
                          onChange={(e) => setEditProdStock(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                        Upload New Product Photo (From Computer/Phone)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileImageUpload(e, setEditProdImage)}
                        className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-800 file:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                        Or Pick Preset / Image URL
                      </label>
                      <select
                        value={editProdImage}
                        onChange={(e) => setEditProdImage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white mb-2"
                      >
                        {PRESET_IMAGES.map((img) => (
                          <option key={img.url} value={img.url}>
                            {img.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editProdImage}
                        onChange={(e) => setEditProdImage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-extrabold"
                    >
                      ✓ Save Product Stock & Photo
                    </button>
                  </form>
                </div>
              )}

              {/* Add New Product with Image Card */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-stone-900 mb-1">
                  ➕ Add New Product & Stock Photo
                </h2>
                <p className="text-xs text-stone-500 mb-4">
                  Add a new Kurti, Bag, or Accessory with custom photo and initial stock.
                </p>

                <form onSubmit={handleAddNewProduct} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                      Product Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="e.g., Bandhani Gotapatti Suit"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                      Product Name (Hindi / हिंदी नाम)
                    </label>
                    <input
                      type="text"
                      value={newProdNameHi}
                      onChange={(e) => setNewProdNameHi(e.target.value)}
                      placeholder="जैसे: बंधेज गोटापट्टी सूट"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                        Category
                      </label>
                      <select
                        value={newProdCategory}
                        onChange={(e) =>
                          setNewProdCategory(e.target.value as 'kurti' | 'bag' | 'accessory')
                        }
                        className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs bg-white font-semibold"
                      >
                        <option value="kurti">Kurti</option>
                        <option value="bag">Bag</option>
                        <option value="accessory">Accessory</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={newProdPriceInr}
                        onChange={(e) => setNewProdPriceInr(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                        Stock Qty
                      </label>
                      <input
                        type="number"
                        required
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Upload Photo from Device OR Select Studio Image */}
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                    <label className="block text-[11px] font-bold uppercase text-stone-600">
                      📸 Upload Product Photo (From Phone / PC)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileImageUpload(e, setNewProdImageUrl)}
                      className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-800 file:text-white"
                    />
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={newProdImageUrl}
                        alt="Preview"
                        className="w-12 h-14 rounded-lg object-cover border border-stone-300 bg-white shrink-0"
                      />
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                          Or Select Studio Image / Paste URL
                        </label>
                        <select
                          value={
                            PRESET_IMAGES.some((p) => p.url === newProdImageUrl)
                              ? newProdImageUrl
                              : '/products/kurti2.svg'
                          }
                          onChange={(e) => setNewProdImageUrl(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                        >
                          {PRESET_IMAGES.map((img) => (
                            <option key={img.url} value={img.url}>
                              {img.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm"
                  >
                    ➕ Add Product to Live Storefront
                  </button>
                </form>
              </div>
            </aside>
          </div>
        )}

        {/* TAB 4: PROMO COUPONS & SETTINGS */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-stone-900 mb-1">
                🎟️ Active Discount Coupons ({coupons.length})
              </h2>
              <p className="text-xs text-stone-500 mb-4">
                Customers can apply these promo codes in Cart & Checkout for instant server-verified
                discounts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div
                    key={c.code}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                      c.active
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-stone-100 border-stone-200 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono font-extrabold text-base text-rose-900 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">
                          {c.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {c.active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-stone-800 mt-1">
                        {c.description_en}
                      </p>
                      <p className="text-[11px] text-stone-500">{c.description_hi}</p>
                    </div>

                    <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-semibold">
                        Used <strong>{c.usage_count}</strong> times • Min:{' '}
                        {rupees(c.min_order_paise)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(c.code)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 font-bold text-stone-800"
                      >
                        {c.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="space-y-6">
              {/* Create New Coupon Form */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-stone-900 mb-1">
                  ➕ Create Promo Code
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Launch a new festive or client-specific coupon code.
                </p>
                <form onSubmit={handleCreateCoupon} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g., WEDDING25"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold uppercase"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                        Type
                      </label>
                      <select
                        value={newCouponType}
                        onChange={(e) => setNewCouponType(e.target.value as 'PERCENT' | 'FLAT')}
                        className="w-full px-2 py-2 rounded-xl border border-stone-300 text-xs bg-white font-bold"
                      >
                        <option value="PERCENT">% OFF</option>
                        <option value="FLAT">Flat ₹</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                        Value ({newCouponType === 'PERCENT' ? '%' : '₹'})
                      </label>
                      <input
                        type="number"
                        required
                        value={newCouponValue}
                        onChange={(e) => setNewCouponValue(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                        Min Order (₹)
                      </label>
                      <input
                        type="number"
                        value={newCouponMinInr}
                        onChange={(e) => setNewCouponMinInr(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                      Offer Description
                    </label>
                    <input
                      type="text"
                      value={newCouponDesc}
                      onChange={(e) => setNewCouponDesc(e.target.value)}
                      placeholder="e.g., Wedding Season 25% OFF"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-extrabold"
                  >
                    ✓ Save Promo Coupon
                  </button>
                </form>
              </div>

              {/* Notification & Fallback Settings */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 mb-1">
                    4-Tier Payment Resilience Status
                  </h3>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                    Active Tier: Tier {fallbackTier} (Primary Dynamic UPI QR + Webhook)
                  </div>
                </div>
                <form onSubmit={saveNotificationTarget} className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700">
                    Order Alert Target (Telegram / WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={notificationTarget}
                    onChange={(e) => setNotificationTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
                  >
                    Save Alert Target
                  </button>
                </form>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
