'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { rupees, useStore } from '../../lib/store';

type AvailableCoupon = {
  code: string;
  description_en: string;
  description_hi: string;
  discount_type: 'PERCENT' | 'FLAT';
  discount_value: number;
  min_order_paise: number;
};

export default function CartPage() {
  const {
    cart,
    lang,
    updateQty,
    removeFromCart,
    appliedCoupon,
    setAppliedCoupon,
    hydrate,
    t,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [discountPaise, setDiscountPaise] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    fetch('/api/coupons')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.coupons)) {
          setAvailableCoupons(d.coupons);
        }
      })
      .catch(() => {});
  }, [hydrate]);

  useEffect(() => {
    if (appliedCoupon) {
      setCouponInput(appliedCoupon);
    }
  }, [appliedCoupon]);

  const subtotalPaise = cart.reduce((acc, item) => acc + item.price_paise * item.qty, 0);

  // Validate coupon against server whenever cart or appliedCoupon changes
  useEffect(() => {
    if (cart.length === 0 || !appliedCoupon) {
      setDiscountPaise(0);
      setCouponMessage(null);
      return;
    }
    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: appliedCoupon, subtotalPaise }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ok && d.success) {
          setDiscountPaise(d.discountPaise || 0);
          setCouponMessage(d.message || `Coupon ${d.code} applied!`);
          setCouponError(null);
        } else {
          setDiscountPaise(0);
          setCouponMessage(null);
          setCouponError(d.error || 'Coupon not eligible for current cart subtotal');
        }
      })
      .catch(() => {});
  }, [cart, subtotalPaise, appliedCoupon]);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply ?? couponInput).trim().toUpperCase();
    if (!code) return;
    setCouponInput(code);
    setAppliedCoupon(code);
  };

  const handleRemoveCoupon = () => {
    setCouponInput('');
    setAppliedCoupon('');
    setDiscountPaise(0);
    setCouponMessage(null);
    setCouponError(null);
  };

  const payablePaise = Math.max(0, subtotalPaise - discountPaise);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-6">
          {t('cart')} ({cart.reduce((a, b) => a + b.qty, 0)})
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-16 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-rose-800 flex items-center justify-center text-2xl mb-4">
              🛍️
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">{t('emptyCartTitle')}</h2>
            <p className="text-stone-500 text-sm mb-6 max-w-md mx-auto">
              {t('emptyCartSubtitle')}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              {t('continueShopping')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const displayName =
                  lang === 'hi' && item.name_hi ? item.name_hi : item.name;
                return (
                  <div
                    key={`${item.id}-${item.size || 'Free Size'}`}
                    className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 flex gap-4 items-center shadow-sm"
                  >
                    <img
                      src={item.image_url || '/products/kurti1.svg'}
                      alt={displayName}
                      className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl object-cover bg-stone-100 border border-stone-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.id}`}
                        className="font-bold text-stone-900 hover:text-rose-800 text-base block truncate"
                      >
                        {displayName}
                      </Link>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {t('selectSize')}: <strong className="text-stone-700">{item.size || 'Free Size'}</strong>
                      </p>
                      <p className="text-sm font-bold text-rose-900 mt-1">
                        {rupees(item.price_paise)} × {item.qty} ={' '}
                        <span className="text-stone-900">{rupees(item.price_paise * item.qty)}</span>
                      </p>

                      <div className="mt-3 flex items-center gap-4">
                        <div className="inline-flex items-center rounded-lg border border-stone-300 bg-stone-50">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => updateQty(item.id, item.size, item.qty - 1)}
                            className="px-2.5 py-1 text-stone-700 hover:bg-stone-200 font-bold text-sm"
                          >
                            −
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-stone-900">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => updateQty(item.id, item.size, item.qty + 1)}
                            className="px-2.5 py-1 text-stone-700 hover:bg-stone-200 font-bold text-sm"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.size)}
                          className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
                        >
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary + Promo Code Engine */}
            <aside className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm h-fit space-y-5">
              <h2 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-3">
                {t('orderSummary')}
              </h2>

              {/* Promo / Coupon Code Input */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                  🎟️ {t('couponCode')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. DIWALI20 or FIRST10"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-3 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold"
                    >
                      {t('removeCoupon')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      className="px-3.5 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold"
                    >
                      {t('applyCoupon')}
                    </button>
                  )}
                </div>

                {couponMessage && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                    ✓ {couponMessage}
                  </p>
                )}
                {couponError && (
                  <p className="mt-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    ⚠️ {couponError}
                  </p>
                )}

                {/* 1-Click Available Coupons */}
                {availableCoupons.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-200/80">
                    <p className="text-[11px] font-bold text-stone-500 mb-2">
                      {t('availableCoupons')}:
                    </p>
                    <div className="space-y-1.5">
                      {availableCoupons.map((c) => {
                        const isSelected = appliedCoupon === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            className={`w-full text-left p-2 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                                : 'bg-white hover:bg-amber-50/60 border-stone-200 text-stone-700'
                            }`}
                          >
                            <div>
                              <span className="font-mono font-extrabold text-rose-800">
                                {c.code}
                              </span>
                              <span className="block text-[11px] text-stone-500">
                                {lang === 'hi' ? c.description_hi : c.description_en}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                              {isSelected ? '✓ Applied' : 'Apply'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>{t('subtotal')}</span>
                  <span className="font-semibold text-stone-900">{rupees(subtotalPaise)}</span>
                </div>
                {discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>
                      {t('discountLabel')} ({appliedCoupon})
                    </span>
                    <span>− {rupees(discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>{t('shipping')}</span>
                  <span className="font-bold text-emerald-700">{t('free')}</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-extrabold text-stone-900">
                  <span>{t('totalPayable')}</span>
                  <span className="text-rose-900 text-xl">{rupees(payablePaise)}</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Inclusive of 5% GST (2.5% CGST + 2.5% SGST). Official GST Invoice generated upon confirmation.
                </p>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center py-3.5 px-6 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm shadow-sm transition-colors"
              >
                {t('checkout')} →
              </Link>

              <Link
                href="/"
                className="block w-full text-center py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-xs transition-colors"
              >
                {t('continueShopping')}
              </Link>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
