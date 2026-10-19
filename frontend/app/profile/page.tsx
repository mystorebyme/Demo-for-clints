'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { Product } from '../../lib/catalog';
import { rupees, useStore } from '../../lib/store';

type SyncedOrder = {
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
  }>;
};

export default function ProfilePage() {
  const {
    lang,
    t,
    customerProfile,
    setCustomerProfile,
    disconnectCustomerProfile,
    wishlist,
    setWishlist,
    hydrate,
  } = useStore();

  const [emailInput, setEmailInput] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [orders, setOrders] = useState<SyncedOrder[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    pincode: '',
    cityState: 'Jaipur, Rajasthan',
    address: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setProfileForm({
      name: customerProfile.name || '',
      phone: customerProfile.phone || '',
      pincode: customerProfile.pincode || '',
      cityState: customerProfile.cityState || 'Jaipur, Rajasthan',
      address: customerProfile.address || '',
    });
    if (customerProfile.email && !emailInput) {
      setEmailInput(customerProfile.email);
    }
  }, [customerProfile]);

  // Load account orders & favourites whenever verified email is active
  useEffect(() => {
    const activeEmail = customerProfile.email?.trim().toLowerCase();
    if (!activeEmail) {
      setOrders([]);
      setWishlistProducts([]);
      return;
    }

    fetch(`/api/account?email=${encodeURIComponent(activeEmail)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.success) return;
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (Array.isArray(data.wishlistProducts)) setWishlistProducts(data.wishlistProducts);
        if (data.profile) {
          setProfileForm({
            name: data.profile.name || customerProfile.name || '',
            phone: data.profile.phone || customerProfile.phone || '',
            pincode: data.profile.pincode || customerProfile.pincode || '',
            cityState: data.profile.cityState || customerProfile.cityState || 'Jaipur, Rajasthan',
            address: data.profile.address || customerProfile.address || '',
          });
        }
      })
      .catch(() => {});
  }, [customerProfile.email, wishlist.length]);

  const handleRequestOtp = async (e?: React.FormEvent, presetEmail?: string) => {
    if (e) e.preventDefault();
    const targetEmail = (presetEmail ?? emailInput).trim().toLowerCase();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setAuthError(
          (lang === 'hi' && data?.error_hi ? data.error_hi : data?.error) ||
            'Please enter a genuine personal email address.'
        );
        setOtpSentTo('');
        return;
      }
      setEmailInput(targetEmail);
      setOtpSentTo(targetEmail);
      setOtpHint(data.otpPreview || '');
      if (targetEmail === 'priya.sharma@gmail.com') {
        setOtpInput('100108');
      }
      setAuthSuccess(
        lang === 'hi'
          ? `6-अंकों का वेरिफिकेशन कोड ${targetEmail} पर भेजा गया है।`
          : `A 6-digit verification code has been dispatched to ${targetEmail}.`
      );
    } catch {
      setAuthError('Unable to send verification code right now.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          email: otpSentTo || emailInput,
          otp: otpInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setAuthError(data?.error || 'Incorrect OTP code.');
        return;
      }

      const prof = data.profile || {};
      const mergedWishlist = Array.from(
        new Set([...(wishlist || []), ...(Array.isArray(prof.wishlist) ? prof.wishlist : [])])
      );
      setWishlist(mergedWishlist);
      setCustomerProfile({
        email: prof.email || otpSentTo,
        name: prof.name || customerProfile.name || '',
        phone: prof.phone || customerProfile.phone || '',
        pincode: prof.pincode || customerProfile.pincode || '',
        cityState: prof.cityState || customerProfile.cityState || 'Jaipur, Rajasthan',
        address: prof.address || customerProfile.address || '',
        emailVerified: true,
        connectedAt: new Date().toISOString(),
      });
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setWishlistProducts(Array.isArray(data.wishlistProducts) ? data.wishlistProducts : []);
      setOtpSentTo('');
      setOtpInput('');
      setOtpHint('');
      setAuthSuccess(
        lang === 'hi'
          ? 'ईमेल सफलतापूर्वक वेरिफाई हो गया। आपके ऑर्डर और सेव किया गया पता लोड हो गए हैं।'
          : 'Email verified successfully. Your orders, invoices, and saved delivery profile are now active.'
      );
    } catch {
      setAuthError('Verification failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setAuthError('');
    try {
      setCustomerProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.replace(/\D/g, '').slice(0, 10),
        pincode: profileForm.pincode.replace(/\D/g, '').slice(0, 6),
        cityState: profileForm.cityState.trim(),
        address: profileForm.address.trim(),
        emailVerified: true,
      });
      setAuthSuccess(
        lang === 'hi'
          ? 'आपका नाम, मोबाइल नंबर और डिलीवरी पता सुरक्षित रूप से सेव हो गया है।'
          : 'Your personal details and delivery address have been saved to your account.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Top Page Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-900 block">
              ZARIYA JAIPUR CLIENT ACCOUNT
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 mt-0.5">
              {lang === 'hi' ? 'मेरी प्रोफ़ाइल, ऑर्डर और पता' : 'My Profile, Orders & Saved Address'}
            </h1>
          </div>

          {customerProfile.email && (
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-800">
                  {customerProfile.emailVerified ? 'OTP VERIFIED ACCOUNT' : 'CONNECTED EMAIL'}
                </span>
                <span className="font-mono font-bold text-stone-900">{customerProfile.email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  disconnectCustomerProfile();
                  setOrders([]);
                  setWishlistProducts([]);
                  setEmailInput('');
                  setAuthSuccess('');
                }}
                className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:border-rose-800 text-xs font-semibold text-stone-700 hover:text-rose-800 transition"
              >
                {t('disconnectAccountBtn')}
              </button>
            </div>
          )}
        </div>

        {authError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm font-medium">
            {authError}
          </div>
        )}
        {authSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium">
            {authSuccess}
          </div>
        )}

        {/* If Not Connected or Not Verified Yet: Show Real Email + 6-Digit OTP Verification Card */}
        {!customerProfile.email ? (
          <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800 block">
                AUTHENTIC EMAIL VERIFICATION
              </span>
              <h2 className="text-xl font-serif font-bold text-stone-950 mt-1">
                {lang === 'hi'
                  ? 'असली ईमेल / Gmail को OTP से वेरिफाई करें'
                  : 'Verify Your Email Address with 6-Digit OTP'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                {lang === 'hi'
                  ? 'सुरक्षा के लिए फेक या डिस्पोज़ेबल ईमेल (जैसे test@gmail.com, 12345@gmail.com, yopmail.com) ब्लॉक हैं। अपनी असली ईमेल दर्ज करें और 6-अंकों के OTP से अपने सभी ऑर्डर, GST बिल और सेव किया गया पता देखें।'
                  : 'To protect customer privacy, disposable or fake emails (such as test@gmail.com, 12345@gmail.com, or temp-mail domains) are strictly rejected. Enter your genuine email address to receive a 6-digit verification code.'}
              </p>
            </div>

            <form onSubmit={(e) => handleRequestOtp(e)} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  {lang === 'hi' ? 'आपकी असली ईमेल / Gmail आईडी' : 'Personal or Corporate Email Address'}
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. ananya.verma@gmail.com"
                    className="flex-1 px-4 py-3 rounded-xl border border-stone-300 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-stone-900"
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-6 py-3 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition shrink-0 disabled:opacity-50"
                  >
                    {authLoading
                      ? '...'
                      : lang === 'hi'
                        ? 'OTP भेजें'
                        : 'Send 6-Digit OTP'}
                  </button>
                </div>
              </div>
            </form>

            {otpSentTo && (
              <form
                onSubmit={handleVerifyOtp}
                className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900">
                    {lang === 'hi'
                      ? `${otpSentTo} पर भेजा गया 6-अंकों का OTP दर्ज करें:`
                      : `Enter 6-Digit OTP sent to ${otpSentTo}:`}
                  </span>
                  {otpHint && (
                    <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-amber-300 font-mono text-xs font-bold">
                      Inbox OTP Code: {otpHint}
                    </span>
                  )}
                </div>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-Digit OTP"
                    className="w-44 px-4 py-2.5 rounded-xl border border-stone-300 font-mono text-base font-bold tracking-[0.25em] bg-white text-center"
                  />
                  <button
                    type="submit"
                    disabled={authLoading || otpInput.length !== 6}
                    className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {lang === 'hi' ? 'वेरिफाई करें' : 'Verify & Open Profile'}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
              <span>
                {lang === 'hi'
                  ? 'मौजूदा ग्राहक प्रोफ़ाइल और ऑर्डर हिस्ट्री टेस्ट करने के लिए:'
                  : 'Want to inspect a pre-existing patron account with confirmed orders?'}
              </span>
              <button
                type="button"
                onClick={() => handleRequestOtp(undefined, 'priya.sharma@gmail.com')}
                className="font-bold text-stone-900 underline hover:text-rose-900"
              >
                {lang === 'hi'
                  ? 'priya.sharma@gmail.com (OTP: 100108) लोड करें'
                  : 'Send OTP for priya.sharma@gmail.com'}
              </button>
            </div>
          </section>
        ) : (
          /* Connected & Verified Customer Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left Column: Personal Info & Saved Delivery Address */}
            <section className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs h-fit space-y-4">
              <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                    SAVED PATRON PROFILE
                  </span>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                    {t('savedProfileTitle')}
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase">
                  Verified
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Verified Email ID
                  </label>
                  <input
                    type="email"
                    disabled
                    value={customerProfile.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-500 mb-1">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Priya Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-stone-500 mb-1">
                      {t('phoneNumber')}
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((s) => ({
                          ...s,
                          phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                        }))
                      }
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-stone-500 mb-1">
                      {t('pincode')}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={profileForm.pincode}
                      onChange={(e) =>
                        setProfileForm((s) => ({
                          ...s,
                          pincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                        }))
                      }
                      placeholder="302001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-500 mb-1">
                    {t('cityState')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.cityState}
                    onChange={(e) => setProfileForm((s) => ({ ...s, cityState: e.target.value }))}
                    placeholder="Jaipur, Rajasthan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-stone-500 mb-1">
                    {t('fullAddress')}
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((s) => ({ ...s, address: e.target.value }))}
                    placeholder="House/Flat No., Building, Street, Landmark"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-3 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition"
                >
                  {savingProfile ? 'Saving...' : t('saveProfileBtn')}
                </button>
              </form>
            </section>

            {/* Right Column: All Orders Placed with This Email + Order Details & GST Invoices */}
            <section className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                      ORDER HISTORY FOR {customerProfile.email.toUpperCase()}
                    </span>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                      {t('myOrdersTitle')} ({orders.length})
                    </h2>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-xs sm:text-sm text-stone-500">
                      {lang === 'hi'
                        ? 'इस ईमेल आईडी से अभी तक कोई ऑर्डर नहीं किया गया है।'
                        : 'No orders have been placed with this email address yet.'}
                    </p>
                    <Link
                      href="/"
                      className="inline-flex px-5 py-2.5 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider"
                    >
                      {t('shopNow')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div
                        key={ord.order_id}
                        className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5 space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                              Order Reference
                            </span>
                            <span className="font-mono text-sm font-extrabold text-stone-950">
                              {ord.order_id}
                            </span>
                            <span className="block text-[11px] text-stone-500 mt-0.5">
                              Placed on{' '}
                              {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
                              {ord.fulfillment_status || ord.status}
                            </span>
                            <p className="text-base font-extrabold text-stone-950 mt-1">
                              {rupees(ord.amount_paise)}
                            </p>
                          </div>
                        </div>

                        {/* Items in Order */}
                        <div className="space-y-1.5 text-xs">
                          {ord.items.map((item, idx) => (
                            <div
                              key={`${item.id}-${idx}`}
                              className="flex items-center justify-between text-stone-700"
                            >
                              <span>
                                <strong>{item.name}</strong> (Size: {item.size}) x {item.qty}
                              </span>
                              <span className="font-mono font-semibold text-stone-900">
                                {rupees(item.line_total_paise || item.price_paise * item.qty)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Metadata & Delivery Address (Visible ONLY in authenticated profile) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-200/80 text-[11px] text-stone-600">
                          <div>
                            <span className="text-stone-400 uppercase text-[9px] font-bold block">
                              Delivery Address & Phone
                            </span>
                            <p className="font-semibold text-stone-800">
                              {ord.customer_name} (+91 {ord.phone})
                            </p>
                            <p className="truncate">{ord.address}</p>
                          </div>
                          <div>
                            <span className="text-stone-400 uppercase text-[9px] font-bold block">
                              Tax Invoice & Courier AWB
                            </span>
                            <p className="font-mono text-stone-800">
                              Invoice: <strong>{ord.invoice_number}</strong>
                            </p>
                            {ord.tracking_id && (
                              <p className="font-mono text-amber-900">
                                AWB: <strong>{ord.tracking_id}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <Link
                            href={`/order/${ord.order_id}`}
                            className="px-4 py-2 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition"
                          >
                            {t('orderDetailsTitle')}
                          </Link>
                          <Link
                            href={`/order/${ord.order_id}/invoice`}
                            className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-bold uppercase tracking-wider hover:border-stone-950 transition"
                          >
                            GST Tax Invoice
                          </Link>
                          {ord.tracking_id && (
                            <Link
                              href={`/track?id=${encodeURIComponent(ord.tracking_id)}`}
                              className="px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-xs font-bold uppercase tracking-wider hover:bg-amber-100 transition"
                            >
                              Live Track
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Favourites under Profile */}
              {wishlistProducts.length > 0 && (
                <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-serif font-bold text-stone-900">
                      {t('wishlistTitle')} ({wishlistProducts.length})
                    </h3>
                    <Link href="/wishlist" className="text-xs font-bold text-amber-900 underline">
                      View All
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {wishlistProducts.slice(0, 3).map((p) => (
                      <ProductCard key={p.id} p={p} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
