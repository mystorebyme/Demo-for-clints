'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { rupees, useStore } from '../../lib/store';

type AccountOrderSummary = {
  order_id: string;
  invoice_number: string;
  tracking_id: string | null;
  status: string;
  fulfillment_status: string;
  amount_paise: number;
  subtotal_paise: number;
  discount_paise: number;
  gst_paise: number;
  courier_name: string;
  estimated_delivery: string | null;
  created_at: string;
  address: string;
  phone: string;
  customer_name: string;
  customer_email: string;
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
};

type WishlistProductItem = {
  id: number;
  name: string;
  name_hi?: string;
  price_paise: number;
  original_price_paise?: number;
  image_url: string;
  category: string;
};

export default function CustomerProfilePage() {
  const {
    lang,
    customerProfile,
    setCustomerProfile,
    disconnectCustomerProfile,
    setWishlist,
  } = useStore();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [registerNameInput, setRegisterNameInput] = useState('');
  const [registerPhoneInput, setRegisterPhoneInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [cityState, setCityState] = useState('Jaipur, Rajasthan');
  const [address, setAddress] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [orders, setOrders] = useState<AccountOrderSummary[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProductItem[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(false);

  useEffect(() => {
    useStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (customerProfile.email) setEmailInput(customerProfile.email);
    if (customerProfile.name) setName(customerProfile.name);
    if (customerProfile.phone) setPhone(customerProfile.phone);
    if (customerProfile.pincode) setPincode(customerProfile.pincode);
    if (customerProfile.cityState) setCityState(customerProfile.cityState);
    if (customerProfile.address) setAddress(customerProfile.address);
  }, [customerProfile]);

  useEffect(() => {
    if (!customerProfile.email || !customerProfile.sessionToken) {
      setOrders([]);
      setWishlistProducts([]);
      return;
    }
    setLoadingAccount(true);
    fetch(`/api/account?email=${encodeURIComponent(customerProfile.email)}`, {
      cache: 'no-store',
      headers: {
        'x-account-token': customerProfile.sessionToken,
      },
    })
      .then((r) => r.json().then((d) => ({ status: r.status, d })))
      .then(({ status, d }) => {
        if (status === 401) {
          disconnectCustomerProfile();
          return;
        }
        if (d?.success) {
          setOrders(Array.isArray(d.orders) ? d.orders : []);
          setWishlistProducts(Array.isArray(d.wishlistProducts) ? d.wishlistProducts : []);
          if (d.profile) {
            if (d.profile.name) setName(d.profile.name);
            if (d.profile.phone) setPhone(d.profile.phone);
            if (d.profile.pincode) setPincode(d.profile.pincode);
            if (d.profile.cityState) setCityState(d.profile.cityState);
            if (d.profile.address) setAddress(d.profile.address);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAccount(false));
  }, [customerProfile.email, customerProfile.sessionToken, disconnectCustomerProfile]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSaveSuccess('');
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !passwordInput) {
      setAuthError(
        lang === 'hi'
          ? 'कृपया ईमेल और पासवर्ड दर्ज करें।'
          : 'Please enter your email address and password.'
      );
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          email: cleanEmail,
          password: passwordInput,
          name: authMode === 'register' ? registerNameInput.trim() : undefined,
          phone: authMode === 'register' ? registerPhoneInput.replace(/\D/g, '') : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.sessionToken) {
        setAuthError(
          (lang === 'hi' && data.error_hi ? data.error_hi : data.error) ||
            'Authentication failed. Please check your credentials.'
        );
        return;
      }

      setCustomerProfile({
        email: cleanEmail,
        sessionToken: data.sessionToken,
        emailVerified: true,
        name: data.profile?.name || registerNameInput.trim() || '',
        phone: data.profile?.phone || registerPhoneInput.replace(/\D/g, '') || '',
        pincode: data.profile?.pincode || '302001',
        cityState: data.profile?.cityState || 'Jaipur, Rajasthan',
        address: data.profile?.address || '',
        connectedAt: new Date().toISOString(),
      });

      if (Array.isArray(data.profile?.wishlist) && data.profile.wishlist.length > 0) {
        setWishlist(data.profile.wishlist);
      }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setWishlistProducts(Array.isArray(data.wishlistProducts) ? data.wishlistProducts : []);
      setPasswordInput('');
    } catch {
      setAuthError('Unable to reach authentication service. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveAddressProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerProfile.email || !customerProfile.sessionToken) return;
    setSaveSuccess('');
    setCustomerProfile({
      email: customerProfile.email,
      sessionToken: customerProfile.sessionToken,
      emailVerified: true,
      name: name.trim(),
      phone: phone.replace(/\D/g, '').slice(-10),
      pincode: pincode.replace(/\D/g, '').slice(0, 6),
      cityState: cityState.trim(),
      address: address.trim(),
    });
    setSaveSuccess(
      lang === 'hi'
        ? 'आपका नाम, फ़ोन नंबर और पता सुरक्षित रूप से सेव हो गया है।'
        : 'Your personal details and delivery address have been saved.'
    );
  };

  const isAuthenticated = Boolean(customerProfile.email && customerProfile.sessionToken);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        {/* Top Profile Banner */}
        <div className="bg-stone-950 text-amber-50 rounded-3xl p-5 sm:p-8 border border-amber-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300 mb-1.5">
              {lang === 'hi' ? 'ग्राहक प्रोफ़ाइल और ऑर्डर हब' : 'CUSTOMER PROFILE & ORDER HUB'}
            </span>
            <h1 className="text-xl sm:text-3xl font-serif font-bold text-white">
              {isAuthenticated
                ? customerProfile.name || customerProfile.email
                : lang === 'hi'
                ? 'अपने अकाउंट में साइन इन करें'
                : 'Sign In to Your Account'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
              {lang === 'hi'
                ? 'आपका अकाउंट पासवर्ड से सुरक्षित है। कोई भी अन्य व्यक्ति आपकी ईमेल आईडी या व्यक्तिगत जानकारी नहीं देख सकता।'
                : 'Your account is password-protected. Only you can view your saved delivery address, personal details, and order history.'}
            </p>
          </div>

          {isAuthenticated && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <span className="px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold">
                AUTHENTICATED: {customerProfile.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  disconnectCustomerProfile();
                  setOrders([]);
                  setWishlistProducts([]);
                  setEmailInput('');
                  setPasswordInput('');
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
              >
                {lang === 'hi' ? 'लॉग आउट करें' : 'Sign Out'}
              </button>
            </div>
          )}
        </div>

        {/* Unauthenticated State: Password-Protected Login / Registration */}
        {!isAuthenticated ? (
          <div className="max-w-lg mx-auto bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-stone-100">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  authMode === 'login'
                    ? 'bg-stone-950 text-amber-300 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {lang === 'hi' ? 'साइन इन करें' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  authMode === 'register'
                    ? 'bg-stone-950 text-amber-300 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {lang === 'hi' ? 'नया अकाउंट बनाएं' : 'Create Account'}
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      {lang === 'hi' ? 'पूरा नाम' : 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={registerNameInput}
                      onChange={(e) => setRegisterNameInput(e.target.value)}
                      placeholder="e.g. Ananya Verma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      {lang === 'hi' ? '10-अंकों का मोबाइल नंबर' : '10-Digit Mobile Number'} *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={registerPhoneInput}
                      onChange={(e) =>
                        setRegisterPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none focus:border-stone-900"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      {lang === 'hi'
                        ? 'यदि आपने पहले इस ईमेल से ऑर्डर किया है, तो सुरक्षा के लिए वही मोबाइल नंबर दर्ज करें।'
                        : 'If you previously placed an order with this email, enter the same mobile number used at checkout to verify ownership.'}
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  {lang === 'hi' ? 'ईमेल आईडी' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  {lang === 'hi' ? 'अकाउंट पासवर्ड (कम से कम 6 अक्षर)' : 'Account Password (min 6 chars)'} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-stone-900"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-300 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
              >
                {authLoading
                  ? 'Verifying...'
                  : authMode === 'login'
                  ? lang === 'hi'
                    ? 'सुरक्षित साइन इन करें'
                    : 'Sign In to My Account'
                  : lang === 'hi'
                  ? 'अकाउंट बनाएं और लॉग इन करें'
                  : 'Create Verified Account'}
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Saved Address & Personal Details Editor */}
            <div className="lg:col-span-1 space-y-6">
              <form
                onSubmit={handleSaveAddressProfile}
                className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-3.5"
              >
                <div className="border-b border-stone-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 block">
                    {lang === 'hi' ? 'निजी प्रोफ़ाइल और पता' : 'SAVED PROFILE & DELIVERY ADDRESS'}
                  </span>
                  <h2 className="text-base font-serif font-bold text-stone-900 mt-0.5">
                    {lang === 'hi' ? 'आपका नाम, फ़ोन और पता' : 'Personal Details & Address'}
                  </h2>
                </div>

                {saveSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    {saveSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    {lang === 'hi' ? 'पूरा नाम' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      {lang === 'hi' ? 'मोबाइल नंबर' : '10-Digit Mobile'}
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      {lang === 'hi' ? 'पिन कोड' : 'PIN Code'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="302001"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    {lang === 'hi' ? 'शहर और राज्य' : 'City & State'}
                  </label>
                  <input
                    type="text"
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder="Jaipur, Rajasthan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    {lang === 'hi' ? 'पूरा पता (मकान / गली / लैंडमार्क)' : 'Full Delivery Address'}
                  </label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Flat No, Building, Street, Landmark"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-stone-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-300 text-xs font-bold uppercase tracking-wider transition"
                >
                  {lang === 'hi' ? 'प्रोफ़ाइल और पता सेव करें' : 'Save Profile & Address'}
                </button>
              </form>
            </div>

            {/* Right Column: Order History + Favourites */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order History Card */}
              <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800 block">
                      {lang === 'hi' ? 'ऑर्डर हिस्ट्री और बिल' : 'MY ORDERS & GST INVOICES'}
                    </span>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 mt-0.5">
                      {lang === 'hi'
                        ? `आपके ऑर्डर (${orders.length})`
                        : `Orders Linked to Your Account (${orders.length})`}
                    </h2>
                  </div>
                </div>

                {loadingAccount ? (
                  <div className="py-10 text-center text-xs text-stone-500">
                    Loading your orders...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-3">
                    <p className="text-sm font-bold text-stone-800">
                      {lang === 'hi'
                        ? 'इस ईमेल से अभी कोई ऑर्डर नहीं मिला।'
                        : 'No orders placed with this email yet.'}
                    </p>
                    <Link
                      href="/"
                      className="inline-block px-5 py-2.5 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider"
                    >
                      {lang === 'hi' ? 'कलेक्शन देखें' : 'Explore Collection'}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div
                        key={ord.order_id}
                        className="rounded-2xl border border-stone-200 p-4 sm:p-5 bg-stone-50/60 space-y-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-sm text-stone-950">
                                {ord.order_id}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                                {ord.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                              GST Invoice: <strong>{ord.invoice_number}</strong> | Placed:{' '}
                              {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                              Grand Total
                            </span>
                            <span className="text-base font-extrabold text-stone-950">
                              {rupees(ord.amount_paise)}
                            </span>
                          </div>
                        </div>

                        {/* Items list */}
                        <div className="space-y-2">
                          {ord.items.map((item, idx) => (
                            <div
                              key={`${ord.order_id}-${item.id}-${idx}`}
                              className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-stone-200/80"
                            >
                              <div className="flex items-center gap-3">
                                {item.image_url && (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-10 h-12 rounded-lg object-cover border border-stone-200"
                                  />
                                )}
                                <div>
                                  <p className="font-bold text-stone-900">
                                    {lang === 'hi' && item.name_hi ? item.name_hi : item.name}
                                  </p>
                                  <p className="text-[11px] text-stone-500">
                                    Size: <strong>{item.size}</strong> | Qty: <strong>{item.qty}</strong>
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-stone-900">
                                {rupees(item.line_total_paise || item.price_paise * item.qty)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery & Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/80 text-xs">
                          <div className="text-stone-600 text-[11px]">
                            <strong>Delivery To:</strong> {ord.customer_name} ({ord.phone}) —{' '}
                            {ord.address}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/order/${ord.order_id}`}
                              className="px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-300 font-bold text-xs transition"
                            >
                              {lang === 'hi' ? 'ऑर्डर डिटेल्स' : 'Order Details'}
                            </Link>
                            <Link
                              href={`/order/${ord.order_id}/invoice`}
                              className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-xs transition"
                            >
                              {lang === 'hi' ? 'GST टैक्स बिल' : 'GST Tax Invoice'}
                            </Link>
                            {ord.tracking_id && (
                              <Link
                                href={`/track?id=${encodeURIComponent(ord.tracking_id)}`}
                                className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold text-xs transition"
                              >
                                {lang === 'hi' ? 'ट्रैक करें' : 'Track Shipment'}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Favourites Card */}
              <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800 block">
                      {lang === 'hi' ? 'पसंदीदा कलेक्शन' : 'SAVED FAVOURITES'}
                    </span>
                    <h2 className="text-base font-serif font-bold text-stone-900 mt-0.5">
                      {lang === 'hi'
                        ? `पसंदीदा आइटम्स (${wishlistProducts.length})`
                        : `Saved Favourites (${wishlistProducts.length})`}
                    </h2>
                  </div>
                  <Link
                    href="/wishlist"
                    className="text-xs font-bold text-amber-900 hover:text-stone-950 underline"
                  >
                    {lang === 'hi' ? 'सभी देखें' : 'View All Favourites'}
                  </Link>
                </div>

                {wishlistProducts.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4">
                    {lang === 'hi'
                      ? 'आपकी पसंदीदा सूची में अभी कोई आइटम नहीं है।'
                      : 'No items saved in your Favourites yet.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {wishlistProducts.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.id}`}
                        className="group rounded-2xl border border-stone-200 p-2.5 hover:border-stone-400 transition bg-stone-50/50"
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full aspect-[3/4] object-cover rounded-xl mb-2"
                        />
                        <p className="text-xs font-bold text-stone-900 line-clamp-1">
                          {lang === 'hi' && item.name_hi ? item.name_hi : item.name}
                        </p>
                        <p className="text-xs font-extrabold text-stone-800 mt-0.5">
                          {rupees(item.price_paise)}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
