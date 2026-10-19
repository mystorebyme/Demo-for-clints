'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { rupees, saveOrderAccessToken, useStore, validateCheckoutForm } from '../../lib/store';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    lang,
    appliedCoupon,
    setAppliedCoupon,
    customerProfile,
    setCustomerProfile,
    hydrate,
    t,
  } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [cityState, setCityState] = useState('Jaipur, Rajasthan');
  const [address, setAddress] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [serverQuote, setServerQuote] = useState<{
    subtotalPaise: number;
    discountPaise: number;
    shippingPaise: number;
    couponCode: string | null;
    couponMessage?: string;
    gstPaise: number;
    totalPaise: number;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinStatus, setPinStatus] = useState<{
    checked: boolean;
    valid: boolean;
    serviceable: boolean;
    district?: string;
    state?: string;
    message_en: string;
    message_hi: string;
  } | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Auto-fill checkout form from synced Gmail / customerProfile
  useEffect(() => {
    if (customerProfile.name && !name) setName(customerProfile.name);
    if (customerProfile.email && !email) setEmail(customerProfile.email);
    if (customerProfile.phone && !phone) setPhone(customerProfile.phone);
    if (customerProfile.pincode && !pincode) setPincode(customerProfile.pincode);
    if (customerProfile.cityState) setCityState(customerProfile.cityState);
    if (customerProfile.address && !address) setAddress(customerProfile.address);
  }, [customerProfile]);

  useEffect(() => {
    setCouponInput(appliedCoupon || '');
  }, [appliedCoupon]);

  // Real-time PIN Code & Store Owner Serviceability Check
  useEffect(() => {
    const cleanPin = pincode.replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) {
      setPinStatus(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/delivery/check?pincode=${encodeURIComponent(cleanPin)}`, {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setPinStatus({
          checked: true,
          valid: Boolean(d.valid),
          serviceable: Boolean(d.serviceable),
          district: d.district,
          state: d.state,
          message_en: d.message_en || '',
          message_hi: d.message_hi || '',
        });
        if (d.valid && d.district && d.state) {
          setCityState(`${d.district}, ${d.state}`);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pincode]);

  const clientSubtotalPaise = cart.reduce((acc, item) => acc + item.price_paise * item.qty, 0);

  useEffect(() => {
    if (cart.length === 0) {
      setServerQuote(null);
      return;
    }
    fetch('/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((i) => ({ id: i.id, qty: i.qty, size: i.size || 'Free Size' })),
        couponCode: appliedCoupon || null,
        email: email.trim() || customerProfile.email || null,
        phone: phone.replace(/\D/g, '') || customerProfile.phone || null,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && typeof d.totalPaise === 'number') {
          setServerQuote({
            subtotalPaise: d.subtotalPaise ?? d.totalPaise,
            discountPaise: d.discountPaise ?? 0,
            shippingPaise: d.shippingPaise ?? 0,
            couponCode: d.couponCode ?? null,
            couponMessage: d.couponMessage,
            gstPaise: d.gstPaise ?? Math.round((d.totalPaise * 5) / 105),
            totalPaise: d.totalPaise,
          });
        }
      })
      .catch(() => {});
  }, [cart, appliedCoupon, email, phone, customerProfile.email, customerProfile.phone]);

  const handleApplyCoupon = (code?: string) => {
    const clean = (code ?? couponInput).trim().toUpperCase();
    setCouponInput(clean);
    setAppliedCoupon(clean);
  };

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const cleanPin = pincode.replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) {
      setErrors((prev) => ({
        ...prev,
        pincode:
          lang === 'hi'
            ? 'कृपया वैध 6-अंकों का पिनकोड दर्ज करें।'
            : 'Please enter a valid 6-digit Indian PIN code.',
      }));
      return;
    }

    if (pinStatus && (!pinStatus.valid || !pinStatus.serviceable)) {
      setServerError(
        lang === 'hi' && pinStatus.message_hi ? pinStatus.message_hi : pinStatus.message_en
      );
      return;
    }

    const fullAddr = `${address.trim()}, ${cityState.trim()}, PIN: ${cleanPin}`;
    const check = validateCheckoutForm({
      name,
      phone,
      email,
      address: fullAddr,
      pincode: cleanPin,
    });

    if (!check.valid) {
      setErrors(check.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    // Persist customer delivery details & Gmail in store + server account for future sessions
    setCustomerProfile({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, ''),
      pincode: pincode.trim(),
      cityState: cityState.trim(),
      address: address.trim(),
      connectedAt: customerProfile.connectedAt || new Date().toISOString(),
    });

    try {
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.replace(/\D/g, ''),
            pincode: cleanPin,
            address: fullAddr,
          },
          items: cart.map((i) => ({ id: i.id, qty: i.qty, size: i.size || 'Free Size' })),
          couponCode: appliedCoupon || null,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.orderId) {
        setServerError(data.error || 'Could not create order. Please check your details.');
        setLoading(false);
        return;
      }

      if (data.orderAccessToken) {
        saveOrderAccessToken(data.orderId, data.orderAccessToken);
      }

      router.push(`/order/${data.orderId}`);
    } catch {
      setServerError('Network error while creating order. Please try again.');
      setLoading(false);
    }
  }

  const displaySubtotal = serverQuote?.subtotalPaise ?? clientSubtotalPaise;
  const displayDiscount = serverQuote?.discountPaise ?? 0;
  const displayShipping = serverQuote?.shippingPaise ?? 0;
  const displayTotal = serverQuote?.totalPaise ?? clientSubtotalPaise;
  const displayGst = serverQuote?.gstPaise ?? Math.round((displayTotal * 5) / 105);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="text-xl sm:text-3xl font-serif font-extrabold text-stone-900 mb-5 sm:mb-6">
          {t('checkout')}
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center">
            <p className="text-stone-600 mb-4">{t('emptyCartTitle')}</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-rose-900 text-white font-semibold text-sm"
            >
              {t('continueShopping')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Checkout Form */}
            <form
              onSubmit={submitOrder}
              noValidate
              className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-5"
            >
              <div className="border-b border-stone-200 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {t('customerDetails')}
                </h2>
              </div>

              {serverError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
                  {serverError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('fullNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  {errors.name && <p className="text-xs text-rose-700 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('phoneNumber')} *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('phonePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  {errors.phone && <p className="text-xs text-rose-700 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  {t('emailAddress')} (Gmail / Email Sync) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  {lang === 'hi'
                    ? 'ऑर्डर कन्फर्म होते ही आपका GST टैक्स बिल और ट्रैकिंग आईडी इसी ईमेल पर भेजे जाएंगे।'
                    : 'Your official GST Tax Invoice and private Tracking ID will be emailed here immediately upon order confirmation.'}
                </p>
                {errors.email && <p className="text-xs text-rose-700 mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('pincode')} (6-Digit Delivery PIN) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={t('pincodePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  {errors.pincode && <p className="text-xs text-rose-700 mt-1">{errors.pincode}</p>}
                  {pinStatus && (
                    <p
                      className={`text-[11px] font-semibold mt-1.5 ${
                        pinStatus.valid && pinStatus.serviceable
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {lang === 'hi' && pinStatus.message_hi
                        ? pinStatus.message_hi
                        : pinStatus.message_en}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('cityState')} (Auto-Verified by PIN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder={t('cityStatePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  {t('fullAddress')} *
                </label>
                <textarea
                  rows={3}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('addressPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {errors.address && <p className="text-xs text-rose-700 mt-1">{errors.address}</p>}
              </div>

              {/* Payment Mode Info */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>{t('paymentMethodTitle')}</span>
                </div>
                <p className="text-xs text-stone-600 mt-1">{t('paymentMethodDesc')}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl bg-rose-900 hover:bg-rose-950 disabled:bg-stone-400 text-white font-bold text-base shadow-sm transition-colors"
              >
                {loading
                  ? lang === 'hi'
                    ? 'सुरक्षित ऑर्डर बनाया जा रहा है...'
                    : 'Generating Secure UPI QR...'
                  : `${t('payNow')} (${rupees(displayTotal)})`}
              </button>
            </form>

            {/* Summary Sidebar + Quick Coupon Switcher */}
            <aside className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-sm h-fit space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">
                {t('orderSummary')}
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex justify-between text-xs gap-2"
                  >
                    <span className="text-stone-700">
                      {lang === 'hi' && item.name_hi ? item.name_hi : item.name} ({item.size}) ×{' '}
                      {item.qty}
                    </span>
                    <span className="font-semibold text-stone-900 shrink-0">
                      {rupees(item.price_paise * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Private Promo Code Input on Checkout (Zero Public Coupon Chips) */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  {t('couponCode')}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder={lang === 'hi' ? 'प्रोमो कोड दर्ज करें' : 'Enter promo code'}
                    className="flex-1 px-2.5 py-2 rounded-lg border border-stone-300 text-xs font-mono font-bold uppercase bg-white"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon('')}
                      className="px-2.5 py-2 rounded-lg bg-stone-200 text-stone-800 text-xs font-bold"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      className="px-3 py-2 rounded-lg bg-rose-900 text-white text-xs font-bold"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {serverQuote?.couponMessage && (
                  <p
                    className={`text-[11px] font-semibold ${
                      serverQuote.couponCode ? 'text-emerald-700' : 'text-amber-800'
                    }`}
                  >
                    {serverQuote.couponMessage}
                  </p>
                )}
                <p className="text-[10px] text-stone-500 leading-relaxed">
                  {lang === 'hi'
                    ? 'T&C: एक प्रोमो कोड एक ग्राहक अकाउंट पर केवल 1 बार मान्य है। फर्स्ट-ऑर्डर कोड केवल पहले ऑर्डर पर लागू होते हैं।'
                    : 'T&C: Valid for 1 single use per customer account. First-order codes apply strictly on the first order only.'}
                </p>
              </div>

              <div className="border-t border-stone-200 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>{t('subtotal')}</span>
                  <span>{rupees(displaySubtotal)}</span>
                </div>
                {displayDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>
                      {t('discountLabel')} ({serverQuote?.couponCode || appliedCoupon})
                    </span>
                    <span>− {rupees(displayDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>{t('shipping')}</span>
                  <span className="text-emerald-700 font-bold">
                    {displayShipping > 0 ? rupees(displayShipping) : t('free')}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-stone-500">
                  <span>Included GST (2.5% CGST + 2.5% SGST)</span>
                  <span>{rupees(displayGst)}</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-extrabold text-stone-900">
                  <span>{t('totalPayable')}</span>
                  <span className="text-rose-900 text-xl">{rupees(displayTotal)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
