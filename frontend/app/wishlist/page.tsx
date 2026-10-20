'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { Product } from '../../lib/catalog';
import { useStore } from '../../lib/store';

export default function WishlistPage() {
  const {
    wishlist,
    setWishlist,
    customerProfile,
    setCustomerProfile,
    lang,
    t,
  } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.products)) {
          setProducts(d.products);
        }
      })
      .catch(() => {});
  }, []);

  const handleQuickGmailSync = async (overrideEmail?: string) => {
    const target = (overrideEmail ?? emailInput).trim().toLowerCase();
    if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(target)) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/account?email=${encodeURIComponent(target)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        const merged = Array.from(
          new Set([
            ...(wishlist || []),
            ...(Array.isArray(data.profile?.wishlist) ? data.profile.wishlist : []),
          ])
        );
        setWishlist(merged);
        setCustomerProfile({
          email: target,
          name: data.profile?.name || customerProfile.name || '',
          phone: data.profile?.phone || customerProfile.phone || '',
          pincode: data.profile?.pincode || customerProfile.pincode || '',
          cityState: data.profile?.cityState || customerProfile.cityState || '',
          address: data.profile?.address || customerProfile.address || '',
          connectedAt: new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-900 block">
              SAVED ATELIER COLLECTION
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-stone-900 mt-0.5">
              {t('wishlistTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {lang === 'hi'
                ? `${wishlistedProducts.length} पसंदीदा आइटम सेव किए गए हैं`
                : `${wishlistedProducts.length} saved items in your personal boutique list`}
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-xs sm:text-sm font-semibold text-stone-700"
          >
            {t('continueShopping')}
          </Link>
        </div>

        {/* Gmail / Email Sync Banner */}
        <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider">
              {customerProfile.email
                ? `${t('accountConnectedLabel')}: ${customerProfile.email}`
                : t('connectGmailTitle')}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">{t('accountSyncSubtitle')}</p>
          </div>
          {!customerProfile.email && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="yourname@gmail.com"
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
              />
              <button
                type="button"
                disabled={syncing}
                onClick={() => handleQuickGmailSync()}
                className="px-4 py-2 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider"
              >
                {syncing ? '...' : 'Sync Gmail'}
              </button>
              <button
                type="button"
                onClick={() => handleQuickGmailSync('priya.sharma@gmail.com')}
                className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-xs font-semibold"
              >
                Demo: priya.sharma@gmail.com
              </button>
            </div>
          )}
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-12 text-center shadow-sm max-w-xl mx-auto">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-800 flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">{t('wishlistTitle')}</h2>
            <p className="text-sm text-stone-500 mb-6">{t('wishlistEmpty')}</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              {t('shopNow')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {wishlistedProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
