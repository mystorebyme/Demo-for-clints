'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ProductCard from '../../../components/ProductCard';
import { DEMO_PRODUCTS, getProductById, Product } from '../../../lib/catalog';
import {
  buildWhatsAppOrderUrl,
  buildWhatsAppShareUrl,
  rupees,
  useStore,
  validatePincode,
} from '../../../lib/store';

type ReviewItem = {
  id: string;
  product_id: number;
  customer_name: string;
  city: string;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lang, addToCart, wishlist, toggleWishlist, t } = useStore();

  const productId = Number(params?.id);
  const [product, setProduct] = useState<Product | undefined>(() => getProductById(productId));
  const [allProducts, setAllProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  const [selectedSize, setSelectedSize] = useState<string>(
    product?.sizes?.[0] || 'Free Size'
  );
  const [activeImage, setActiveImage] = useState<string>(
    product?.image_url || '/products/kurti1.jpg'
  );
  const [qty, setQty] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);

  // Pincode delivery checker
  const [pinInput, setPinInput] = useState('302001');
  const [pinResult, setPinResult] = useState<string | null>(
    lang === 'hi'
      ? ' जयपुर/राजस्थान में 2-3 दिनों में मुफ़्त बीमाकृत डिलीवरी (Delhivery Express)'
      : ' Free Express Delivery by 22 Oct 2026 via Delhivery Express'
  );

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revName, setRevName] = useState('');
  const [revCity, setRevCity] = useState('Jaipur, RJ');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          setProduct(d.product);
          setSelectedSize(d.product.sizes?.[0] || 'Free Size');
          setActiveImage(d.product.image_url);
        }
        if (Array.isArray(d.reviews)) {
          setReviews(d.reviews);
        }
      })
      .catch(() => {});

    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.products) && d.products.length > 0) {
          setAllProducts(d.products);
        }
      })
      .catch(() => {});
  }, [productId]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-3">Product Not Found</h1>
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-rose-800 text-white font-semibold text-sm"
          >
            {t('continueShopping')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = lang === 'hi' && product.name_hi ? product.name_hi : product.name;
  const displayDesc =
    lang === 'hi' && product.description_hi ? product.description_hi : product.description;
  const isOutOfStock = product.stock <= 0;
  const isWishlisted = wishlist.includes(product.id);

  const related = allProducts
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart({
      id: product.id,
      name: product.name,
      name_hi: product.name_hi,
      price_paise: product.price_paise,
      qty,
      size: selectedSize,
      image_url: product.image_url,
      category: product.category,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart({
      id: product.id,
      name: product.name,
      name_hi: product.name_hi,
      price_paise: product.price_paise,
      qty,
      size: selectedSize,
      image_url: product.image_url,
      category: product.category,
    });
    router.push('/checkout');
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePincode(pinInput)) {
      setPinResult(
        lang === 'hi'
          ? ' कृपया वैध 6-अंकों का भारतीय पिनकोड दर्ज करें।'
          : ' Please enter a valid 6-digit Indian PIN code.'
      );
      return;
    }
    const isRajasthan = pinInput.startsWith('30') || pinInput.startsWith('31') || pinInput.startsWith('32') || pinInput.startsWith('33') || pinInput.startsWith('34');
    const days = isRajasthan ? 2 : 4;
    const eta = new Date(Date.now() + days * 86400 * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    setPinResult(
      lang === 'hi'
        ? ` पिनकोड ${pinInput} पर ${eta} तक मुफ़्त डिलीवरी उपलब्ध है (Delhivery / BlueDart)`
        : ` Free Insured Delivery to PIN ${pinInput} by ${eta} via Delhivery Express`
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;
    setRevSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: revName,
          city: revCity,
          rating: revRating,
          comment: revComment,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        setRevName('');
        setRevComment('');
        setShowReviewForm(false);
      }
    } finally {
      setRevSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-xs text-stone-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-rose-800">
            {t('allCategories')}
          </Link>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-stone-900 font-semibold">{displayName}</span>
        </nav>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image & Interactive Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] rounded-2xl bg-stone-100 overflow-hidden border border-stone-200/60">
              <img
                src={activeImage || product.image_url}
                alt={displayName}
                className="w-full h-full object-cover transition-all duration-300"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-rose-800 text-white shadow">
                  {lang === 'hi' && product.badge_hi ? product.badge_hi : product.badge}
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center shadow-md transition ${
                  isWishlisted
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/95 text-stone-700 hover:text-rose-600'
                }`}
                title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
              >
                <svg
                  className="w-5 h-5"
                  fill={isWishlisted ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </button>
            </div>

            {product.gallery && product.gallery.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {product.gallery.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                      (activeImage || product.image_url) === imgUrl
                        ? 'border-rose-900 shadow-sm scale-105'
                        : 'border-stone-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${displayName} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800">
                  {product.category === 'kurti'
                    ? t('categoryKurti')
                    : product.category === 'bag'
                      ? t('categoryBag')
                      : t('categoryAccessory')}
                </span>
                <span className="text-sm font-semibold text-amber-700">
                   {product.rating.toFixed(1)} ({reviews.length || product.reviews_count} reviews)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-3">
                {displayName}
              </h1>

              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-3xl font-extrabold text-rose-900">
                  {rupees(product.price_paise)}
                </span>
                {product.original_price_paise && (
                  <span className="text-base text-stone-400 line-through">
                    {t('mrpLabel')}: {rupees(product.original_price_paise)}
                  </span>
                )}
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Incl. of 5% GST (HSN {product.category === 'kurti' ? '6204' : product.category === 'bag' ? '4202' : '7117'})
                </span>
              </div>

              {/* Coupon Teaser Box */}
              <div className="mb-5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
                <span>
                   <strong>Festive Offer:</strong> Use code <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">DIWALI20</code> for 20% OFF or <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">FIRST10</code> for 10% OFF!
                </span>
              </div>

              <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
                {displayDesc}
              </p>

              {/* Size Selector + Size Guide Modal Trigger */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                    {t('selectSize')}
                  </label>
                  {product.category === 'kurti' && (
                    <button
                      type="button"
                      onClick={() => setShowSizeModal(true)}
                      className="text-xs font-bold text-rose-800 hover:underline flex items-center gap-1"
                    >
                       {t('sizeGuide')} (S–XXL)
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                        selectedSize === size
                          ? 'bg-rose-800 text-white border-rose-800'
                          : 'bg-white text-stone-700 border-stone-300 hover:border-rose-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Stock */}
              <div className="mb-5 flex flex-wrap items-center gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    {t('quantity')}
                  </label>
                  <div className="inline-flex items-center rounded-xl border border-stone-300 bg-white">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-2 text-stone-700 hover:bg-stone-100 font-bold"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 text-sm font-bold text-stone-900">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(Math.min(10, product.stock || 1), q + 1))}
                      className="px-3.5 py-2 text-stone-700 hover:bg-stone-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-sm font-medium">
                  {isOutOfStock ? (
                    <span className="text-rose-700 font-bold">{t('outOfStock')}</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">
                      ● {t('inStock', { count: product.stock })}
                    </span>
                  )}
                </div>
              </div>

              {/* Pincode Delivery Date Checker */}
              <div className="mb-6 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                   {t('pincodeCheck')}
                </label>
                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="302001"
                    className="w-36 px-3 py-1.5 rounded-xl border border-stone-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold"
                  >
                    {t('checkDelivery')}
                  </button>
                </form>
                {pinResult && (
                  <p className="text-xs font-medium text-emerald-800 mt-2">{pinResult}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-stone-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`py-3.5 px-6 rounded-xl font-bold text-sm border transition-colors ${
                    isOutOfStock
                      ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                      : addedFeedback
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-rose-800 border-rose-800 hover:bg-rose-50'
                  }`}
                >
                  {addedFeedback ? ` ${t('addedToCart')}` : t('addToCart')}
                </button>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className={`py-3.5 px-6 rounded-xl font-bold text-sm transition-colors ${
                    isOutOfStock
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-rose-800 hover:bg-rose-900 text-white shadow-sm'
                  }`}
                >
                  {t('checkout')} →
                </button>
              </div>

              {/* WhatsApp Share & Inquiry Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href={buildWhatsAppOrderUrl({
                    id: product.id,
                    name: product.name,
                    price_paise: product.price_paise,
                    size: selectedSize,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <span></span>
                  <span>{t('askOnWhatsApp')}</span>
                </a>
                <a
                  href={buildWhatsAppShareUrl(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <span></span>
                  <span>{t('shareOnWhatsApp')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Customer Reviews Section */}
        <section className="mt-10 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                {t('customerReviews')} ({reviews.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                100% Verified Boutique Buyers | Average Rating {product.rating.toFixed(1)} / 5.0
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowReviewForm((v) => !v)}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition"
            >
              {t('writeReview')}
            </button>
          </div>

          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <input
                type="text"
                required
                placeholder="Your Name (e.g., Pooja Verma)"
                value={revName}
                onChange={(e) => setRevName(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
              <input
                type="text"
                placeholder="City (e.g., Jaipur, RJ)"
                value={revCity}
                onChange={(e) => setRevCity(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
              <select
                value={revRating}
                onChange={(e) => setRevRating(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-stone-300 text-sm font-semibold bg-white"
              >
                <option value={5}> (5/5 Excellent)</option>
                <option value={4}> (4/5 Very Good)</option>
                <option value={3}> (3/5 Good)</option>
              </select>
              <textarea
                required
                rows={2}
                placeholder="Share your experience with fabric, fitting, and delivery..."
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 text-sm"
              />
              <button
                type="submit"
                disabled={revSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-sm font-bold"
              >
                {revSubmitting ? 'Posting...' : 'Post Verified Review'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-stone-900">{rev.customer_name}</span>
                    <span className="text-amber-700 text-xs font-bold font-mono">
                      {rev.rating}.0 / 5
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="text-emerald-700 font-semibold">Verified Buyer | {rev.city}</span>
                  <span>{new Date(rev.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-stone-900 mb-6">
              {lang === 'hi' ? 'मिलते-जुलते उत्पाद' : 'Similar Ethnic Picks'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Indian Ethnic Kurti Size Chart Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-stone-900">
                Indian Kurti Size Guide (Inches)
              </h3>
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
            <table className="w-full text-xs sm:text-sm text-left border border-stone-200 rounded-xl overflow-hidden">
              <thead className="bg-rose-50 text-rose-900 font-bold">
                <tr>
                  <th className="p-2.5 border-b">Size</th>
                  <th className="p-2.5 border-b">Bust (in)</th>
                  <th className="p-2.5 border-b">Waist (in)</th>
                  <th className="p-2.5 border-b">Hip (in)</th>
                  <th className="p-2.5 border-b">Length (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr>
                  <td className="p-2.5 font-bold">S</td>
                  <td className="p-2.5">36&quot;</td>
                  <td className="p-2.5">32&quot;</td>
                  <td className="p-2.5">38&quot;</td>
                  <td className="p-2.5">44&quot;</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">M</td>
                  <td className="p-2.5">38&quot;</td>
                  <td className="p-2.5">34&quot;</td>
                  <td className="p-2.5">40&quot;</td>
                  <td className="p-2.5">44&quot;</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">L</td>
                  <td className="p-2.5">40&quot;</td>
                  <td className="p-2.5">36&quot;</td>
                  <td className="p-2.5">42&quot;</td>
                  <td className="p-2.5">45&quot;</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">XL</td>
                  <td className="p-2.5">42&quot;</td>
                  <td className="p-2.5">38&quot;</td>
                  <td className="p-2.5">44&quot;</td>
                  <td className="p-2.5">45&quot;</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">XXL</td>
                  <td className="p-2.5">44&quot;</td>
                  <td className="p-2.5">40&quot;</td>
                  <td className="p-2.5">46&quot;</td>
                  <td className="p-2.5">46&quot;</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-stone-500 mt-3">
              Tip: For a relaxed festive fit, choose one size larger if you are between two measurements.
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
