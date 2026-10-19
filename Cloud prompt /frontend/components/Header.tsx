'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatINR, useStore } from '../lib/store';

type SyncedOrderSummary = {
  order_id: string;
  invoice_number: string;
  tracking_id: string | null;
  status: string;
  fulfillment_status: string;
  amount_paise: number;
  created_at: string;
  items: Array<{ id: number; name: string; qty: number; size: string; price_paise: number }>;
};

export default function Header() {
  const pathname = usePathname();
  const {
    lang,
    setLang,
    t,
    totalCount,
    totalPaise,
    wishlist,
    setWishlist,
    customerProfile,
    setCustomerProfile,
    disconnectCustomerProfile,
  } = useStore();

  const count = totalCount();
  const bagTotal = totalPaise();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [otpPendingEmail, setOtpPendingEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpPreview, setOtpPreview] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncedOrders, setSyncedOrders] = useState<SyncedOrderSummary[]>([]);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    pincode: '',
    cityState: '',
    address: '',
  });

  useEffect(() => {
    setProfileForm({
      name: customerProfile.name || '',
      phone: customerProfile.phone || '',
      pincode: customerProfile.pincode || '',
      cityState: customerProfile.cityState || '',
      address: customerProfile.address || '',
    });
    if (customerProfile.email && !emailInput) {
      setEmailInput(customerProfile.email);
    }
  }, [customerProfile, emailInput]);

  // Whenever drawer opens and an email is connected, load latest orders & profile from /api/account
  useEffect(() => {
    if (!drawerOpen) return;
    const activeEmail = customerProfile.email?.trim().toLowerCase();
    if (!activeEmail) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/account?email=${encodeURIComponent(activeEmail)}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.success) return;
        if (Array.isArray(data.orders)) {
          setSyncedOrders(data.orders);
        }
        if (data.profile) {
          setCustomerProfile({
            email: data.profile.email || activeEmail,
            name: data.profile.name || customerProfile.name,
            phone: data.profile.phone || customerProfile.phone,
            pincode: data.profile.pincode || customerProfile.pincode,
            cityState: data.profile.cityState || customerProfile.cityState,
            address: data.profile.address || customerProfile.address,
            connectedAt: customerProfile.connectedAt || new Date().toISOString(),
          });
          if (Array.isArray(data.profile.wishlist) && data.profile.wishlist.length > 0) {
            const merged = Array.from(new Set([...wishlist, ...data.profile.wishlist]));
            setWishlist(merged);
          }
        }
      } catch {
        // Ignore transient network errors
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [drawerOpen, customerProfile.email]);

  const handleRequestOtp = async (overrideEmail?: string) => {
    const targetEmail = (overrideEmail ?? emailInput).trim().toLowerCase();
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setSyncMessage(
          (lang === 'hi' && data?.error_hi ? data.error_hi : data?.error) ||
            'Please enter a genuine personal email address.'
        );
        return;
      }
      setEmailInput(targetEmail);
      setOtpPendingEmail(targetEmail);
      setOtpPreview(data.otpPreview || '');
      if (targetEmail === 'priya.sharma@gmail.com') {
        setOtpInput('100108');
      }
      setSyncMessage(
        lang === 'hi'
          ? `6-अंकों का OTP ${targetEmail} पर भेजा गया (कोड: ${data.otpPreview})`
          : `6-digit OTP sent to ${targetEmail} (Inbox Code: ${data.otpPreview})`
      );
    } catch {
      setSyncMessage(lang === 'hi' ? 'OTP भेजने में समस्या हुई' : 'Unable to send OTP right now');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpPendingEmail || otpInput.length !== 6) return;
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          email: otpPendingEmail,
          otp: otpInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setSyncMessage(data?.error || 'Invalid OTP code');
        return;
      }

      const serverProfile = data.profile || {};
      const mergedWishlist = Array.from(
        new Set([...(wishlist || []), ...(Array.isArray(serverProfile.wishlist) ? serverProfile.wishlist : [])])
      );

      setWishlist(mergedWishlist);
      setCustomerProfile({
        email: otpPendingEmail,
        name: serverProfile.name || customerProfile.name || '',
        phone: serverProfile.phone || customerProfile.phone || '',
        pincode: serverProfile.pincode || customerProfile.pincode || '',
        cityState: serverProfile.cityState || customerProfile.cityState || 'Jaipur, Rajasthan',
        address: serverProfile.address || customerProfile.address || '',
        emailVerified: true,
        connectedAt: new Date().toISOString(),
      });
      setSyncedOrders(Array.isArray(data.orders) ? data.orders : []);
      setOtpPendingEmail('');
      setOtpInput('');
      setOtpPreview('');
      setSyncMessage(
        lang === 'hi'
          ? 'ईमेल OTP वेरिफाई हो गया — ऑर्डर, पता और पसंदीदा लोड हो गए'
          : 'Email verified via OTP — Orders, Address & Favourites synced'
      );
    } catch {
      setSyncMessage('Unable to verify OTP right now');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.replace(/\D/g, '').slice(0, 10),
      pincode: profileForm.pincode.replace(/\D/g, '').slice(0, 6),
      cityState: profileForm.cityState.trim(),
      address: profileForm.address.trim(),
    });
    setSyncMessage(t('profileSavedToast'));
    setShowProfileEditor(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#FAF7F2]/95 backdrop-blur-md">
        {/* Top Heritage Ribbon — Zero Emojis */}
        <div className="bg-stone-950 text-amber-100/90 text-[10px] sm:text-xs tracking-[0.16em] uppercase py-2 px-4 border-b border-amber-500/20">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <span className="truncate font-medium">{t('marqueeShipping')}</span>
            <span className="hidden md:inline text-amber-300 font-semibold">
              {t('marqueeCoupon')}
            </span>
          </div>
        </div>

        {/* Main Header Bar: Brand on Left, 3-Lines Menu Button on Right (No Bag/Track/Wishlist/Lang clutter) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-950 text-amber-300 flex items-center justify-center font-serif font-bold text-lg sm:text-xl tracking-wider border border-amber-500/40 shadow-sm group-hover:border-amber-400 transition shrink-0">
              Z
            </div>
            <div className="truncate">
              <span className="block font-serif text-lg sm:text-2xl font-bold tracking-[0.16em] text-stone-950 leading-none">
                ZARIYA
              </span>
              <span className="block text-[9px] sm:text-[10px] uppercase tracking-[0.26em] text-amber-800 font-semibold mt-1">
                JAIPUR ROYAL ATELIER
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Clicking the Email / Profile Pill in Header Opens the Full User Profile (/profile) */}
            <Link
              href="/profile"
              data-testid="header-profile-link"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                customerProfile.email
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                  : 'bg-white border-stone-300 text-stone-800 hover:border-stone-900'
              }`}
              title={
                lang === 'hi'
                  ? 'प्रोफ़ाइल, ऑर्डर डिटेल और पता खोलें'
                  : 'Open My Profile, Order History & Saved Address'
              }
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="max-w-[130px] sm:max-w-[180px] truncate">
                {customerProfile.email
                  ? customerProfile.email
                  : lang === 'hi'
                    ? 'प्रोफ़ाइल'
                    : 'Profile'}
              </span>
            </Link>

            {/* 3-Lines Hamburger Button — Opens Track, Order Details, Favourites, Language, Gmail Sync & Bag */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('menuTitle')}
              data-testid="header-menu-button"
              className="relative inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white hover:border-stone-900 text-stone-900 transition shadow-sm"
            >
              <svg
                className="w-5 h-5 text-stone-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-stone-900">
                {lang === 'hi' ? 'मेनू' : 'Menu'}
              </span>
              {(count > 0 || wishlist.length > 0) && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-600 text-stone-950 text-[10px] font-extrabold">
                  {count > 0 ? count : wishlist.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over 3-Lines Menu Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="relative z-10 w-full max-w-md bg-[#FAF7F2] h-full overflow-y-auto shadow-2xl border-l border-stone-200 flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="sticky top-0 z-20 bg-stone-950 text-white px-5 py-4 flex items-center justify-between border-b border-amber-500/30">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-amber-300 font-semibold">
                    ZARIYA JAIPUR
                  </p>
                  <h2 className="font-serif text-lg font-bold tracking-wide">
                    {t('menuTitle')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t('closeMenu')}
                  className="p-2 rounded-lg border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* 1. Gmail / Email Account Sync Section */}
                <section className="rounded-2xl bg-white border border-stone-200/90 p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-900 shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-stone-900">
                          {t('accountSectionTitle')}
                        </h3>
                        <p className="text-[11px] text-stone-500 leading-snug mt-0.5">
                          {t('accountSyncSubtitle')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {customerProfile.email ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                        <Link
                          href="/profile"
                          onClick={() => setDrawerOpen(false)}
                          className="min-w-0 flex-1 hover:underline"
                        >
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            {t('accountConnectedLabel')} — TAP TO OPEN PROFILE
                          </span>
                          <span className="block text-xs font-semibold text-stone-900 truncate">
                            {customerProfile.email}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            disconnectCustomerProfile();
                            setSyncedOrders([]);
                            setEmailInput('');
                            setSyncMessage(null);
                          }}
                          className="text-[11px] font-semibold text-stone-600 hover:text-rose-700 underline shrink-0"
                        >
                          {t('disconnectAccountBtn')}
                        </button>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setDrawerOpen(false)}
                        className="block w-full text-center py-2.5 px-3 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition"
                      >
                        {lang === 'hi'
                          ? 'पूरी प्रोफ़ाइल, ऑर्डर और पता खोलें'
                          : 'Open Full Profile, Orders & Address'}
                      </Link>

                      {/* Saved Address & Phone Summary */}
                      <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                            {t('savedProfileTitle')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowProfileEditor((v) => !v)}
                            className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline"
                          >
                            {showProfileEditor
                              ? lang === 'hi'
                                ? 'बंद करें'
                                : 'Close'
                              : lang === 'hi'
                                ? 'बदलें / सेव करें'
                                : 'Edit / Save'}
                          </button>
                        </div>
                        {customerProfile.name || customerProfile.phone || customerProfile.address ? (
                          <div className="text-stone-600 space-y-0.5 pt-1">
                            {customerProfile.name && (
                              <p className="font-semibold text-stone-900">
                                {customerProfile.name}{' '}
                                {customerProfile.phone ? `(+91 ${customerProfile.phone})` : ''}
                              </p>
                            )}
                            {customerProfile.address && (
                              <p className="text-[11px] leading-relaxed">{customerProfile.address}</p>
                            )}
                            {(customerProfile.cityState || customerProfile.pincode) && (
                              <p className="text-[11px] text-stone-500">
                                {customerProfile.cityState}{' '}
                                {customerProfile.pincode ? `— PIN: ${customerProfile.pincode}` : ''}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-stone-500">
                            {lang === 'hi'
                              ? 'अपना पता और फ़ोन नंबर सेव करें ताकि चेकआउट तुरंत हो सके।'
                              : 'Save your address and phone number for instant 1-tap checkout.'}
                          </p>
                        )}
                      </div>

                      {/* Inline Profile Editor */}
                      {showProfileEditor && (
                        <form onSubmit={handleSaveProfileDetails} className="space-y-2.5 pt-2 border-t border-stone-200">
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))}
                            placeholder={lang === 'hi' ? 'पूरा नाम' : 'Full Name'}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-900"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) =>
                                setProfileForm((s) => ({
                                  ...s,
                                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                                }))
                              }
                              placeholder={lang === 'hi' ? '10-अंकों का मोबाइल' : '10-Digit Mobile'}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-900"
                            />
                            <input
                              type="text"
                              value={profileForm.pincode}
                              onChange={(e) =>
                                setProfileForm((s) => ({
                                  ...s,
                                  pincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                                }))
                              }
                              placeholder={lang === 'hi' ? 'पिन कोड (302001)' : 'PIN Code (302001)'}
                              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-900"
                            />
                          </div>
                          <input
                            type="text"
                            value={profileForm.cityState}
                            onChange={(e) =>
                              setProfileForm((s) => ({ ...s, cityState: e.target.value }))
                            }
                            placeholder={lang === 'hi' ? 'शहर और राज्य' : 'City & State (e.g. Jaipur, Rajasthan)'}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-900"
                          />
                          <textarea
                            rows={2}
                            value={profileForm.address}
                            onChange={(e) =>
                              setProfileForm((s) => ({ ...s, address: e.target.value }))
                            }
                            placeholder={lang === 'hi' ? 'मकान नंबर, गली, लैंडमार्क' : 'House/Flat No., Street, Landmark'}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-900"
                          />
                          <button
                            type="submit"
                            className="w-full py-2 rounded-lg bg-stone-900 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition"
                          >
                            {t('saveProfileBtn')}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2.5">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder={t('emailPlaceholder')}
                          className="flex-1 min-w-0 px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-900 focus:outline-none focus:border-stone-900"
                        />
                        <button
                          type="button"
                          disabled={syncLoading}
                          onClick={() => handleRequestOtp()}
                          className="px-3.5 py-2 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition shrink-0 disabled:opacity-50"
                        >
                          {syncLoading ? '...' : lang === 'hi' ? 'OTP भेजें' : 'Send OTP'}
                        </button>
                      </div>

                      {otpPendingEmail && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-stone-800">
                              6-Digit OTP ({otpPendingEmail})
                            </span>
                            {otpPreview && (
                              <span className="font-mono font-bold text-amber-950">
                                Code: {otpPreview}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={otpInput}
                              onChange={(e) =>
                                setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                              }
                              placeholder="Enter 6-digit OTP"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-xs font-bold tracking-widest"
                            />
                            <button
                              type="button"
                              disabled={syncLoading || otpInput.length !== 6}
                              onClick={handleVerifyOtp}
                              className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                            >
                              Verify
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRequestOtp('priya.sharma@gmail.com')}
                        className="w-full text-left px-3 py-2 rounded-xl border border-amber-300/80 bg-amber-50/70 hover:bg-amber-100/70 transition text-[11px] text-amber-950 flex items-center justify-between"
                      >
                        <span>
                          {lang === 'hi'
                            ? 'प्रिया शर्मा (priya.sharma@gmail.com) OTP वेरिफाई करें'
                            : 'Verify Sample Patron: priya.sharma@gmail.com'}
                        </span>
                        <span className="font-bold underline">
                          {lang === 'hi' ? 'OTP: 100108' : 'OTP: 100108'}
                        </span>
                      </button>
                    </div>
                  )}

                  {syncMessage && (
                    <p className="mt-2.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                      {syncMessage}
                    </p>
                  )}
                </section>

                {/* 2. Primary Menu Actions (Order Details, Track, Favourites, Shopping Bag) */}
                <section className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 px-1">
                    {lang === 'hi' ? 'नेविगेशन और ऑर्डर' : 'Store & Order Navigation'}
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {/* Track Order */}
                    <Link
                      href="/track"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                        pathname?.startsWith('/track')
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-900 border-stone-200 hover:border-stone-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-wider">
                            {t('trackOrder')}
                          </span>
                          <span className="block text-[11px] opacity-75">
                            {lang === 'hi'
                              ? '12-अंकों की ट्रैकिंग आईडी से लाइव स्थिति देखें'
                              : 'Live courier status via 12-digit Tracking ID'}
                          </span>
                        </div>
                      </div>
                      <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>

                    {/* Favourites / Wishlist */}
                    <Link
                      href="/wishlist"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                        pathname?.startsWith('/wishlist')
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-900 border-stone-200 hover:border-stone-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-wider">
                            {t('wishlist')}
                          </span>
                          <span className="block text-[11px] opacity-75">
                            {lang === 'hi'
                              ? 'आपकी सेव की गई पसंदीदा डिज़ाइन'
                              : 'Your saved atelier pieces synced with Gmail'}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-amber-100 text-amber-950 text-xs font-bold">
                        {wishlist.length}
                      </span>
                    </Link>

                    {/* Shopping Bag */}
                    <Link
                      href="/cart"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                        pathname?.startsWith('/cart')
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-900 border-stone-200 hover:border-stone-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                        </svg>
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-wider">
                            {t('bag')}
                          </span>
                          <span className="block text-[11px] opacity-75">
                            {count > 0
                              ? `${count} ${t('items')} — ${formatINR(bagTotal)}`
                              : t('emptyCart')}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-stone-900 text-amber-300 text-xs font-bold">
                        {count}
                      </span>
                    </Link>
                  </div>
                </section>

                {/* 3. Language Selector inside 3-Lines Drawer */}
                <section className="rounded-2xl bg-white border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-stone-900">
                        {t('languageLabel')}
                      </span>
                      <span className="block text-[11px] text-stone-500">
                        {lang === 'hi' ? 'हिंदी / English चुनें' : 'Switch store language'}
                      </span>
                    </div>
                    <div className="inline-flex rounded-xl border border-stone-300 p-0.5 bg-stone-100">
                      <button
                        type="button"
                        onClick={() => setLang('en')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          lang === 'en'
                            ? 'bg-stone-950 text-amber-300 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang('hi')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          lang === 'hi'
                            ? 'bg-stone-950 text-amber-300 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        हिंदी
                      </button>
                    </div>
                  </div>
                </section>

                {/* 4. My Orders & Order Details (Synced via Gmail or Demo Order) */}
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                      {t('myOrdersTitle')}
                    </p>
                    {customerProfile.email && (
                      <span className="text-[11px] font-semibold text-amber-900">
                        {syncedOrders.length} {lang === 'hi' ? 'ऑर्डर' : 'Orders'}
                      </span>
                    )}
                  </div>

                  {syncedOrders.length > 0 ? (
                    <div className="space-y-3">
                      {syncedOrders.map((ord) => (
                        <div
                          key={ord.order_id}
                          className="rounded-2xl bg-white border border-stone-200 p-4 space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                                Order Reference
                              </span>
                              <span className="font-mono text-xs font-bold text-stone-900">
                                {ord.order_id}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {ord.fulfillment_status || ord.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50 rounded-xl p-2.5 border border-stone-200/70">
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-stone-400">
                                GST Tax Invoice
                              </span>
                              <span className="font-mono font-semibold text-stone-800">
                                {ord.invoice_number}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-stone-400">
                                Total Paid
                              </span>
                              <span className="font-bold text-stone-900">
                                {formatINR(ord.amount_paise)}
                              </span>
                            </div>
                            {ord.tracking_id && (
                              <div className="col-span-2 pt-1 border-t border-stone-200/70">
                                <span className="block text-[9px] uppercase tracking-wider text-stone-400">
                                  12-Digit Courier AWB / Tracking ID
                                </span>
                                <span className="font-mono font-bold text-amber-900">
                                  {ord.tracking_id}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Link
                              href={`/order/${ord.order_id}`}
                              onClick={() => setDrawerOpen(false)}
                              className="flex-1 text-center py-2 px-3 rounded-xl bg-stone-950 text-amber-300 text-[11px] font-bold uppercase tracking-wider hover:bg-stone-800 transition"
                            >
                              {t('orderDetailsTitle')}
                            </Link>
                            <Link
                              href={`/order/${ord.order_id}/invoice`}
                              onClick={() => setDrawerOpen(false)}
                              className="py-2 px-3 rounded-xl border border-stone-300 bg-white text-stone-800 text-[11px] font-bold uppercase tracking-wider hover:border-stone-900 transition"
                            >
                              GST Bill
                            </Link>
                            {ord.tracking_id && (
                              <Link
                                href={`/track?id=${encodeURIComponent(ord.tracking_id)}`}
                                onClick={() => setDrawerOpen(false)}
                                className="py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-[11px] font-bold uppercase tracking-wider hover:bg-amber-100 transition"
                              >
                                Track
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white border border-stone-200 p-4 text-xs text-stone-600 space-y-2">
                      <p>{t('noOrdersFound')}</p>
                      <Link
                        href="/order/ORDDEMO1001"
                        onClick={() => setDrawerOpen(false)}
                        className="inline-flex items-center gap-1.5 text-amber-900 font-bold underline text-[11px]"
                      >
                        <span>
                          {lang === 'hi'
                            ? 'सैंपल ऑर्डर और GST बिल देखें (ORDDEMO1001)'
                            : 'View Sample Confirmed Order & GST Bill (ORDDEMO1001)'}
                        </span>
                      </Link>
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-stone-200 bg-white text-[11px] text-stone-500 flex items-center justify-between">
              <span>GSTIN: 08AABCK7412R1Z5</span>
              <span>Jaipur, Rajasthan (08)</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
