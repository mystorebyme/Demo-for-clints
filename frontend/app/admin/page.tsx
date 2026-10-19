'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { rupees } from '../../lib/store';
import { Product } from '../../lib/catalog';

type FulfillmentStatus =
  | 'PENDING_PAYMENT'
  | 'ORDER_PLACED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

type AdminOrder = {
  order_id: string;
  invoice_number?: string;
  subtotal_paise?: number;
  discount_paise?: number;
  shipping_paise?: number;
  coupon_code?: string | null;
  gst_paise?: number;
  amount_paise: number;
  status: string;
  tracking_id?: string | null;
  fulfillment_status?: FulfillmentStatus;
  courier_name?: string;
  estimated_delivery?: string | null;
  email_sent?: boolean;
  email_sent_at?: string | null;
  customer_name: string;
  customer_email?: string;
  phone: string;
  address: string;
  created_at: string;
  items?: { id: number; name: string; qty: number; size: string; price_paise: number }[];
};

type AnalyticsSummary = {
  totalOrdersCount: number;
  confirmedOrdersCount: number;
  pendingOrdersCount: number;
  totalRevenuePaise: number;
  totalDiscountPaise: number;
  totalGstPaise: number;
  totalUnitsSold: number;
  lowStockProducts: { id: number; name: string; stock: number }[];
  categoryBreakdown: { category: string; revenuePaise: number; unitsSold: number }[];
  dailySeries: { label: string; revenuePaise: number; ordersCount: number }[];
};

type CouponRecord = {
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

type StoreProfile = {
  storeName: string;
  legalName: string;
  gstin: string;
  pan: string;
  stateName: string;
  stateCode: string;
  address: string;
  supportEmail: string;
  supportPhone: string;
  invoicePrefix: string;
  freeShippingThresholdPaise: number;
  shippingChargePaise: number;
  gstRatePercent: number;
  signatoryName: string;
};

type EmailReceiptRecord = {
  id: string;
  order_id: string;
  to_email: string;
  customer_name: string;
  subject: string;
  tracking_id: string;
  invoice_number: string;
  amount_paise: number;
  html_preview: string;
  sent_at: string;
  status: string;
};

const TRACKING_STAGE_BUTTONS: { status: FulfillmentStatus; label: string }[] = [
  { status: 'ORDER_PLACED', label: '✓ Confirmed' },
  { status: 'PACKED', label: '📦 Packed' },
  { status: 'SHIPPED', label: '🚚 Shipped' },
  { status: 'OUT_FOR_DELIVERY', label: '🛵 Out for Delivery' },
  { status: 'DELIVERED', label: '🎉 Delivered' },
];

const PRESET_PRODUCT_SVG_OPTIONS = [
  { label: 'Jaipuri Indigo Anarkali', url: '/products/kurti1.svg' },
  { label: 'Maharani Crimson Zardozi', url: '/products/kurti2.svg' },
  { label: 'Awadhi Pastel Chikankari', url: '/products/kurti3.svg' },
  { label: 'Banarasi Katan Silk Kurti', url: '/products/kurti4.svg' },
  { label: 'Dabu Artisan Tote Bag', url: '/products/bag1.svg' },
  { label: 'Kalamkari Vegan Sling Bag', url: '/products/bag2.svg' },
  { label: 'Zardozi Bridal Velvet Potli', url: '/products/bag3.svg' },
  { label: 'Jaipuri Block-Print Jhola', url: '/products/bag4.svg' },
  { label: 'Meenakari Peacock Jhumkas', url: '/products/acc1.svg' },
  { label: 'Phulkari Silk Zari Dupatta', url: '/products/acc2.svg' },
  { label: 'Bikaneri Jadau Kundan Choker', url: '/products/acc3.svg' },
  { label: 'Ghungroo Silver Payal Pair', url: '/products/acc4.svg' },
];

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState('dev_admin_token_replace_me_123456');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'orders' | 'products' | 'coupons' | 'gst_profile' | 'emails'
  >('orders');

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [products, setProducts] = useState<(Product & { sold_count?: number })[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [sentEmails, setSentEmails] = useState<EmailReceiptRecord[]>([]);
  const [previewEmail, setPreviewEmail] = useState<EmailReceiptRecord | null>(null);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdNameHi, setNewProdNameHi] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'kurti' | 'bag' | 'accessory'>('kurti');
  const [newProdPriceRupees, setNewProdPriceRupees] = useState('1499');
  const [newProdMrpRupees, setNewProdMrpRupees] = useState('2499');
  const [newProdStock, setNewProdStock] = useState('15');
  const [newProdImage, setNewProdImage] = useState('/products/kurti1.svg');
  const [newProdDesc, setNewProdDesc] = useState(
    'Handcrafted Jaipur couture piece with artisan embroidery and authentic GI-certified finish.'
  );

  // Per-product inline image edit state
  const [editingImageMap, setEditingImageMap] = useState<Record<number, string>>({});

  // New Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [newCouponValue, setNewCouponValue] = useState('15');
  const [newCouponMinRupees, setNewCouponMinRupees] = useState('999');
  const [newCouponDesc, setNewCouponDesc] = useState('Special Festive Discount');

  const fetchAllAdminData = useCallback(
    async (tok = adminToken) => {
      setError('');
      try {
        const ordersRes = await fetch('/api/admin/orders', {
          headers: { 'x-admin-token': tok },
          cache: 'no-store',
        });

        const ordersData = await ordersRes.json();
        if (!ordersRes.ok || !ordersData.success) {
          setError(ordersData.error || 'Invalid admin token');
          return;
        }
        setOrders(ordersData.orders || []);
        setAnalytics(ordersData.analytics || null);
        if (Array.isArray(ordersData.products)) setProducts(ordersData.products);
        if (Array.isArray(ordersData.coupons)) setCoupons(ordersData.coupons);
        if (Array.isArray(ordersData.emails)) setSentEmails(ordersData.emails);
        if (ordersData.storeProfile) setStoreProfile(ordersData.storeProfile);
        setAuthenticated(true);
      } catch {
        setError('Could not load Admin Dashboard data');
      }
    },
    [adminToken]
  );

  async function verifyOrder(orderId: string) {
    setActionMsg('');
    const res = await fetch('/api/dev/mock-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMsg(
        `Order ${orderId} confirmed! Stock deducted, Tracking ID (${data.trackingId}) generated & Email Receipt dispatched.`
      );
      fetchAllAdminData();
    }
  }

  async function updateTrackingStage(orderId: string, fulfillmentStatus: FulfillmentStatus) {
    setActionMsg('');
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/tracking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        fulfillmentStatus,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMsg(
        `Order ${orderId} tracking updated to ${fulfillmentStatus} (${data.order?.trackingId || ''})`
      );
      fetchAllAdminData();
    }
  }

  async function adjustProductStock(productId: number, currentStock: number, delta: number) {
    setActionMsg('');
    const nextStock = Math.max(0, currentStock + delta);
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({ id: productId, stock: nextStock }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMsg(
        `Stock updated for ${data.product.name} → ${data.product.stock} units remaining`
      );
      fetchAllAdminData();
    }
  }

  async function saveProductImage(productId: number, newImgUrl: string) {
    if (!newImgUrl.trim()) return;
    setActionMsg('');
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({ id: productId, image_url: newImgUrl.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMsg(`Product photo updated for ${data.product.name}`);
      fetchAllAdminData();
    }
  }

  async function handleAddNewProduct(e: React.FormEvent) {
    e.preventDefault();
    setActionMsg('');
    const pricePaise = Math.max(100, Math.round(Number(newProdPriceRupees) * 100));
    const mrpPaise = Math.max(pricePaise, Math.round(Number(newProdMrpRupees) * 100));
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
        stock: Number(newProdStock),
        image_url: newProdImage,
        description: newProdDesc,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMsg(
        `Added new product "${data.product.name}" with ${data.product.stock} stock units!`
      );
      setNewProdName('');
      setNewProdNameHi('');
      fetchAllAdminData();
    }
  }

  async function handleAddCoupon(e: React.FormEvent) {
    e.preventDefault();
    setActionMsg('');
    const val =
      newCouponType === 'FLAT'
        ? Math.round(Number(newCouponValue) * 100)
        : Number(newCouponValue);
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({
        code: newCouponCode,
        discount_type: newCouponType,
        discount_value: val,
        min_order_paise: Math.round(Number(newCouponMinRupees) * 100),
        max_discount_paise: 100000,
        description_en: newCouponDesc,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setActionMsg(`Coupon ${data.coupon.code} saved!`);
      setNewCouponCode('');
      fetchAllAdminData();
    }
  }

  async function handleToggleCoupon(code: string) {
    await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({ action: 'toggle', code }),
    });
    fetchAllAdminData();
  }

  async function handleSaveStoreProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!storeProfile) return;
    setActionMsg('');
    const res = await fetch('/api/admin/store-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify(storeProfile),
    });
    const data = await res.json();
    if (data.success) {
      setStoreProfile(data.storeProfile);
      setActionMsg(
        `Store GST & Billing Profile saved for "${data.storeProfile.storeName}" (GSTIN: ${data.storeProfile.gstin})! All GST invoices now use this profile.`
      );
    }
  }

  useEffect(() => {
    fetchAllAdminData('dev_admin_token_replace_me_123456');
  }, [fetchAllAdminData]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Top Header + Auth Bar */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div>
              <span className="inline-block px-3 py-0.5 rounded-full bg-rose-100 text-rose-900 text-xs font-extrabold uppercase tracking-wider mb-1">
                Private Merchant Operations Console (Direct Link /admin)
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                Revenue, Inventory, Custom GST Profile & Live Tracking
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Manage orders, customize your store&apos;s GST Tax Invoice details, inspect sent customer email receipts, and update inventory.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchAllAdminData();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Admin token"
                className="px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold"
              >
                {authenticated ? '↻ Refresh' : 'Unlock'}
              </button>
            </form>
          </div>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
              {error}
            </div>
          )}

          {actionMsg && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between">
              <span>✓ {actionMsg}</span>
              <button
                type="button"
                onClick={() => setActionMsg('')}
                className="text-xs underline ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* KPI Summary Cards & Visual Revenue Chart */}
          {analytics && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950 to-rose-900 text-white">
                  <span className="text-[11px] uppercase tracking-wider text-rose-200 font-bold">
                    Total Verified Revenue
                  </span>
                  <p className="text-2xl font-extrabold mt-1">
                    {rupees(analytics.totalRevenuePaise)}
                  </p>
                  <span className="text-[11px] text-amber-300">
                    Incl. {rupees(analytics.totalGstPaise)} GST
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">
                    Confirmed Orders
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                    {analytics.confirmedOrdersCount}{' '}
                    <span className="text-xs font-normal text-stone-500">
                      / {analytics.totalOrdersCount} total
                    </span>
                  </p>
                  <span className="text-[11px] text-stone-500">
                    {analytics.pendingOrdersCount} awaiting payment
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">
                    Units Sold
                  </span>
                  <p className="text-2xl font-extrabold text-stone-900 mt-1">
                    {analytics.totalUnitsSold}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Auto-deducted from stock
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">
                    Email Receipts Sent
                  </span>
                  <p className="text-2xl font-extrabold text-rose-900 mt-1">
                    {sentEmails.length}
                  </p>
                  <span className="text-[11px] text-stone-500">
                    Auto-dispatched on confirm
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[11px] uppercase tracking-wider text-amber-900 font-bold">
                    Low Stock Alerts (≤5)
                  </span>
                  <p className="text-2xl font-extrabold text-amber-950 mt-1">
                    {analytics.lowStockProducts.length}
                  </p>
                  <span className="text-[11px] text-amber-800 truncate block">
                    {analytics.lowStockProducts.map((p) => `${p.name} (${p.stock})`).join(', ') ||
                      'All items well-stocked'}
                  </span>
                </div>
              </div>

              {/* 7-Day Revenue Bar Chart + Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-5 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                      📊 7-Day Revenue Trend (INR)
                    </h3>
                    <span className="text-xs font-bold text-emerald-700">
                      Live UPI Settlement Analytics
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4">
                    {analytics.dailySeries.map((d) => {
                      const maxRev = Math.max(
                        ...analytics.dailySeries.map((x) => x.revenuePaise),
                        100000
                      );
                      const heightPct = Math.max(
                        12,
                        Math.round((d.revenuePaise / maxRev) * 100)
                      );
                      return (
                        <div
                          key={d.label}
                          className="flex flex-col items-center justify-end h-full gap-1"
                        >
                          <span className="text-[10px] font-mono font-bold text-stone-700">
                            {rupees(d.revenuePaise)}
                          </span>
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-rose-900 to-amber-600 shadow-sm transition-all"
                            title={`${d.label}: ${rupees(d.revenuePaise)} (${d.ordersCount} orders)`}
                          />
                          <span className="text-[10px] font-bold text-stone-500">{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                    🛍️ Category Sales Mix
                  </h3>
                  {analytics.categoryBreakdown.map((c) => (
                    <div
                      key={c.category}
                      className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-extrabold uppercase text-stone-800">
                          {c.category}
                        </p>
                        <p className="text-[11px] text-stone-500">{c.unitsSold} units sold</p>
                      </div>
                      <span className="text-sm font-mono font-extrabold text-rose-900">
                        {rupees(c.revenuePaise)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                activeTab === 'orders'
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              📦 Orders & Live Tracking ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                activeTab === 'products'
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              👗 Stock & Product Photo Manager ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gst_profile')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                activeTab === 'gst_profile'
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              🏛️ Customize Store GST & Invoice Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                activeTab === 'emails'
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              ✉️ Sent Email Receipts ({sentEmails.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('coupons')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                activeTab === 'coupons'
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              🎟️ Promo Coupons ({coupons.length})
            </button>
          </div>
        </div>

        {/* TAB 1: ORDERS & LIVE TRACKING */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-extrabold text-stone-900 mb-4">
              Customer Orders, GST Invoices, Email Receipts & Live Shipment Tracking
            </h2>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase text-stone-400">
                  <th className="py-3 px-2">Order / Invoice</th>
                  <th className="py-3 px-2">Customer & Email</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Payment & Receipt</th>
                  <th className="py-3 px-2">Confidential Tracking ID</th>
                  <th className="py-3 px-2">Update Live Shipment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {orders.map((o) => {
                  const isPaid = o.status === 'CONFIRMED' || o.status === 'PAID';
                  return (
                    <tr key={o.order_id} className="align-top">
                      <td className="py-4 px-2 font-mono font-bold text-stone-900">
                        <Link
                          href={`/order/${o.order_id}`}
                          className="text-rose-900 hover:underline"
                        >
                          {o.order_id}
                        </Link>
                        <div className="mt-1">
                          <Link
                            href={`/order/${o.order_id}/invoice`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] font-sans font-bold"
                          >
                            📄 GST Invoice
                          </Link>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="font-semibold text-stone-900">{o.customer_name}</div>
                        <div className="text-xs text-stone-500">{o.phone}</div>
                        {o.customer_email && (
                          <div className="text-xs text-rose-900 font-mono">
                            {o.customer_email}
                          </div>
                        )}
                        {o.items && o.items.length > 0 && (
                          <div className="text-[11px] text-stone-500 mt-1">
                            {o.items.map((i) => `${i.name} (×${i.qty})`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2 font-bold text-stone-900">
                        {rupees(o.amount_paise)}
                        {o.discount_paise && o.discount_paise > 0 ? (
                          <span className="block text-[10px] text-emerald-700 font-semibold">
                            Saved {rupees(o.discount_paise)} ({o.coupon_code})
                          </span>
                        ) : null}
                      </td>
                      <td className="py-4 px-2 space-y-1.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {o.status}
                        </span>
                        {o.email_sent && (
                          <div className="text-[11px] text-emerald-800 font-semibold">
                            ✉️ Receipt Emailed
                          </div>
                        )}
                        {!isPaid && (
                          <div>
                            <button
                              type="button"
                              onClick={() => verifyOrder(o.order_id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                            >
                              Confirm Payment & Deduct Stock
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2 font-mono text-xs">
                        {o.tracking_id ? (
                          <div className="space-y-1">
                            <Link
                              href={`/track?id=${encodeURIComponent(o.tracking_id)}`}
                              className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 font-bold hover:underline"
                            >
                              {o.tracking_id}
                            </Link>
                            <div className="text-[11px] text-stone-500 font-sans">
                              Stage: <strong>{o.fulfillment_status}</strong>
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400">Generated on confirm</span>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {TRACKING_STAGE_BUTTONS.map((btn) => {
                            const active = o.fulfillment_status === btn.status;
                            return (
                              <button
                                key={btn.status}
                                type="button"
                                onClick={() => updateTrackingStage(o.order_id, btn.status)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                  active
                                    ? 'bg-rose-900 text-white border-rose-900 shadow-sm'
                                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                                }`}
                              >
                                {btn.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: INVENTORY, STOCK & PRODUCT PHOTO MANAGER */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-extrabold text-stone-900 mb-1">
                ➕ Add New Product & Stock Image to Live Storefront
              </h2>
              <p className="text-xs text-stone-500 mb-5">
                Add a new item with a custom image URL or select from the luxury studio artwork gallery. Stock automatically decreases as customers purchase.
              </p>

              <form
                onSubmit={handleAddNewProduct}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Product Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g., Royal Zari Silk Anarkali"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Product Title (Hindi)
                  </label>
                  <input
                    type="text"
                    value={newProdNameHi}
                    onChange={(e) => setNewProdNameHi(e.target.value)}
                    placeholder="e.g., रॉयल ज़री सिल्क अनारकली"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Category *
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) =>
                      setNewProdCategory(e.target.value as 'kurti' | 'bag' | 'accessory')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="kurti">Kurtis & Ensembles</option>
                    <option value="bag">Bridal Potlis & Bags</option>
                    <option value="accessory">Jadau Jewellery & Dupattas</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProdPriceRupees}
                      onChange={(e) => setNewProdPriceRupees(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      MRP (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProdMrpRupees}
                      onChange={(e) => setNewProdMrpRupees(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      Stock *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Stock Image URL (or pick preset artwork) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newProdImage}
                      onChange={(e) => setNewProdImage(e.target.value)}
                      placeholder="/products/kurti1.svg or https://..."
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                    />
                    <select
                      value={newProdImage}
                      onChange={(e) => setNewProdImage(e.target.value)}
                      className="px-2.5 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
                    >
                      {PRESET_PRODUCT_SVG_OPTIONS.map((opt) => (
                        <option key={opt.url} value={opt.url}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs font-extrabold shadow-sm transition"
                  >
                    + Publish Product to Live Catalog
                  </button>
                </div>
              </form>
            </div>

            {/* Live Catalog Stock & Image Table */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm overflow-x-auto">
              <h2 className="text-lg font-extrabold text-stone-900 mb-4">
                👗 Live Inventory, Stock Count & Image Manager ({products.length} Products)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => {
                  const customImgVal = editingImageMap[p.id] ?? p.image_url;
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between gap-3"
                    >
                      <div className="flex gap-3.5">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-20 h-24 rounded-xl object-cover border border-stone-200 bg-white shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono uppercase text-stone-400">
                            #{p.id} • {p.category}
                          </span>
                          <h3 className="text-sm font-extrabold text-stone-900 truncate">
                            {p.name}
                          </h3>
                          <p className="text-xs font-bold text-rose-900 mt-0.5">
                            {rupees(p.price_paise)}{' '}
                            {p.original_price_paise && (
                              <span className="text-stone-400 line-through font-normal">
                                {rupees(p.original_price_paise)}
                              </span>
                            )}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                                p.stock <= 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : p.stock <= 5
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              Stock: {p.stock} units
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustProductStock(p.id, p.stock, -1)}
                              className="px-2 py-0.5 rounded bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold"
                              title="Decrease stock by 1"
                            >
                              −1
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustProductStock(p.id, p.stock, 5)}
                              className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                              title="Add 5 units to stock"
                            >
                              +5 Stock
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          Update Stock Image URL / Preset
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={customImgVal}
                            onChange={(e) =>
                              setEditingImageMap((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-mono bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => saveProductImage(p.id, customImgVal)}
                            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-rose-900 text-white text-xs font-bold shrink-0"
                          >
                            Save Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STORE GST & BILLING PROFILE CUSTOMIZER */}
        {activeTab === 'gst_profile' && storeProfile && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            <div className="border-b border-stone-200 pb-4 mb-6">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
                Multi-Store White-Label GST Billing Configuration
              </span>
              <h2 className="text-xl font-extrabold text-stone-900 mt-0.5">
                🏛️ Customize Store GST Tax Invoice & Brand Identity
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Every GST Tax Invoice (`/order/[id]/invoice`) and automated customer Email Receipt is dynamically generated using the store profile below. Customize it for any client store.
              </p>
            </div>

            <form
              onSubmit={handleSaveStoreProfile}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Store Brand Name (Invoice Header) *
                </label>
                <input
                  type="text"
                  required
                  value={storeProfile.storeName}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, storeName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Registered Legal Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={storeProfile.legalName}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, legalName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Store GSTIN (15-Char) *
                </label>
                <input
                  type="text"
                  required
                  value={storeProfile.gstin}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, gstin: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Business PAN *
                </label>
                <input
                  type="text"
                  required
                  value={storeProfile.pan}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, pan: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Invoice Serial Prefix *
                </label>
                <input
                  type="text"
                  required
                  value={storeProfile.invoicePrefix}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, invoicePrefix: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Home State *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeProfile.stateName}
                    onChange={(e) =>
                      setStoreProfile({ ...storeProfile, stateName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    State Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeProfile.stateCode}
                    onChange={(e) =>
                      setStoreProfile({ ...storeProfile, stateCode: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Registered Store Address *
                </label>
                <input
                  type="text"
                  required
                  value={storeProfile.address}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Support Email *
                </label>
                <input
                  type="email"
                  value={storeProfile.supportEmail}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, supportEmail: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Support Phone *
                </label>
                <input
                  type="text"
                  value={storeProfile.supportPhone}
                  onChange={(e) =>
                    setStoreProfile({ ...storeProfile, supportPhone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Authorized Signatory Line *
                </label>
                <input
                  type="text"
                  value={storeProfile.signatoryName}
                  onChange={(e) =>
                    setStoreProfile({
                      ...storeProfile,
                      signatoryName: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={28}
                  value={storeProfile.gstRatePercent}
                  onChange={(e) =>
                    setStoreProfile({
                      ...storeProfile,
                      gstRatePercent: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Free Shipping Threshold (Paise, e.g., 99900 = ₹999)
                </label>
                <input
                  type="number"
                  min={0}
                  value={storeProfile.freeShippingThresholdPaise}
                  onChange={(e) =>
                    setStoreProfile({
                      ...storeProfile,
                      freeShippingThresholdPaise: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Standard Delivery Charge Below Threshold (Paise)
                </label>
                <input
                  type="number"
                  min={0}
                  value={storeProfile.shippingChargePaise}
                  onChange={(e) =>
                    setStoreProfile({
                      ...storeProfile,
                      shippingChargePaise: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between pt-4 border-t border-stone-200">
                <Link
                  href="/order/ORDDEMO1001/invoice"
                  className="text-xs font-extrabold text-rose-900 hover:underline"
                >
                  📄 Preview Live GST Invoice with Current Settings →
                </Link>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs sm:text-sm font-extrabold shadow-sm transition"
                >
                  💾 Save Store GST & Invoice Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: SENT EMAIL RECEIPTS OUTBOX */}
        {activeTab === 'emails' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900">
                ✉️ Automated Customer Email Receipts Outbox ({sentEmails.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Every time an order is confirmed, the server automatically generates and dispatches an HTML Email Receipt containing the itemized GST Tax Invoice and the customer&apos;s confidential Tracking ID.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs uppercase text-stone-400">
                    <th className="py-3 px-2">Sent At</th>
                    <th className="py-3 px-2">Recipient Email</th>
                    <th className="py-3 px-2">Order / Invoice</th>
                    <th className="py-3 px-2">Tracking ID Included</th>
                    <th className="py-3 px-2">Amount</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {sentEmails.map((em) => (
                    <tr key={em.id}>
                      <td className="py-3.5 px-2 font-mono text-xs text-stone-500">
                        {new Date(em.sent_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-2 font-mono font-bold text-stone-900">
                        {em.to_email}
                      </td>
                      <td className="py-3.5 px-2 font-mono">
                        <Link
                          href={`/order/${em.order_id}`}
                          className="text-rose-900 font-bold hover:underline"
                        >
                          {em.order_id}
                        </Link>
                        <span className="block text-[11px] text-stone-500">
                          {em.invoice_number}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-mono font-bold text-emerald-800">
                        {em.tracking_id}
                      </td>
                      <td className="py-3.5 px-2 font-bold">{rupees(em.amount_paise)}</td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => setPreviewEmail(em)}
                          className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs"
                        >
                          👁️ View HTML Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PROMO COUPONS MANAGER */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm h-fit">
              <h2 className="text-base font-extrabold text-stone-900 mb-1">
                🎟️ Create / Update Promo Coupon
              </h2>
              <p className="text-xs text-stone-500 mb-4">
                Create percentage or flat rupee discount codes for festive sales.
              </p>

              <form onSubmit={handleAddCoupon} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={newCouponType}
                      onChange={(e) =>
                        setNewCouponType(e.target.value as 'PERCENT' | 'FLAT')
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    >
                      <option value="PERCENT">Percentage (%)</option>
                      <option value="FLAT">Flat Rupees (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      {newCouponType === 'PERCENT' ? 'Percent Off (%)' : 'Flat Off (₹)'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newCouponMinRupees}
                    onChange={(e) => setNewCouponMinRupees(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    Offer Description
                  </label>
                  <input
                    type="text"
                    required
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs font-extrabold"
                >
                  Save Promo Coupon
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
              <h2 className="text-base font-extrabold text-stone-900 mb-2">
                Active & Configured Storefront Coupons
              </h2>
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-amber-100 border border-amber-300 text-rose-950 font-mono font-extrabold text-xs">
                        {c.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {c.active ? 'ACTIVE' : 'PAUSED'}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        Used {c.usage_count} times
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-stone-700 mt-1.5">
                      {c.description_en}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleCoupon(c.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                      c.active
                        ? 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        : 'bg-emerald-700 text-white border-emerald-700'
                    }`}
                  >
                    {c.active ? 'Pause Coupon' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* HTML Email Preview Modal */}
      {previewEmail && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewEmail(null)}
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
                <h3 className="text-sm font-bold truncate">{previewEmail.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-stone-50">
              <div
                className="bg-white rounded-xl shadow-sm overflow-hidden"
                dangerouslySetInnerHTML={{ __html: previewEmail.html_preview }}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
