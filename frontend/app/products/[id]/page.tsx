'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ProductCard, { formatEthnicSizeLabel } from '../../../components/ProductCard';
import { DEMO_PRODUCTS, getProductById, getProductPriceForSize, Product } from '../../../lib/catalog';
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

const RECENTLY_VIEWED_KEY = 'zariya_recently_viewed_v1';

function buildGarmentSpecifications(product: Product) {
  const lowerName = product.name.toLowerCase();
  if (product.category === 'kurti') {
    const isAnarkali = lowerName.includes('anarkali') || lowerName.includes('kalidar');
    const isSharara = lowerName.includes('sharara');
    const isPalazzo = lowerName.includes('palazzo') || lowerName.includes('set');
    const isChanderi = lowerName.includes('chanderi') || lowerName.includes('silk');
    const isKota = lowerName.includes('kota');
    const fabric = isChanderi
      ? 'Pure Chanderi Silk-Cotton Blend with Zari Weave'
      : isKota
      ? 'Handwoven Kota Doria Khat-Check Cotton'
      : '100% Pure Jaipur Mulmul / Handloom Cambric Cotton (60x60 Count)';
    const craft = lowerName.includes('zardozi')
      ? 'Hand Zardozi &Bikaneri Marodi Metallic Embroidery'
      : lowerName.includes('chikankari')
      ? 'Authentic Hand-Stitched Tepchi & Bakhiya Chikankari'
      : lowerName.includes('bandhej') || lowerName.includes('bandhani') || lowerName.includes('leheriya')
      ? 'Traditional Rajasthani Tie-Dye & Hand Gota-Patti Applique'
      : 'Sanganeri / Bagru Wooden Hand-Block Print with Natural Vegetable Dyes';

    return [
      { label: 'Kurta Fabric', value: fabric },
      { label: 'Craft & Work', value: craft },
      {
        label: 'Silhouette & Flair',
        value: isAnarkali
          ? '16-Kali Full Flared Anarkali (3.8m Ghera)'
          : isSharara
          ? 'Festive Kurta with Tiered Flared Sharara'
          : 'Tailored Straight / A-Line Ethnic Fit',
      },
      {
        label: 'Inner Lining',
        value: isChanderi || isKota ? '100% Breathable Soft Cotton Voile Lining Attached' : 'Opaque Breathable Weave (Skin-Friendly)',
      },
      { label: 'Kurta Length & Sleeves', value: '45–46 Inches Length | 17 Inches Three-Quarter Sleeves' },
      {
        label: 'Bottom & Dupatta Details',
        value:
          isAnarkali || isSharara || isPalazzo
            ? 'Coordinated 38-inch Cotton/Silk Trouser-Palazzo & 2.35m Hand-Finished Zari/Block-Print Dupatta'
            : 'Kurta Piece (Pairs Effortlessly with Ivory / Gold Palazzos & Churidars)',
      },
      { label: 'Net Weight & HSN', value: '~480 Grams | HSN 6204 (5% GST Inclusive)' },
      {
        label: 'Country of Origin & Atelier',
        value: 'India — Handcrafted & Quality Checked at Zariya Jaipur Heritage Guild, Johari Bazar, Jaipur 302003',
      },
    ];
  }

  if (product.category === 'bag') {
    const isPotli = lowerName.includes('potli');
    const isClutch = lowerName.includes('clutch');
    return [
      {
        label: 'Outer Textile',
        value: isPotli || isClutch
          ? 'Rich Bridal Velvet / Raw Silk with Reinforced Frame'
          : 'Quilted Hand-Block Cotton Canvas & Heritage Handloom Jute-Ikat',
      },
      {
        label: 'Artisan Surface Work',
        value: lowerName.includes('mirror') || lowerName.includes('abhla')
          ? 'Kutchi Abhla Mirror-Work & Resham Thread Embroidery'
          : 'Hand-Stitched Zardozi, Gota-Patti & Pearl Tassel Detailing',
      },
      { label: 'Interior & Compartments', value: 'Soft Sanganeri Cotton Lining with Zippered Security Pocket' },
      {
        label: 'Strap & Closure',
        value: isPotli
          ? 'Braided Pearl & Gold Tassel Drawstring Wrist Handle'
          : isClutch
          ? 'Royal Clasp Closure with Detachable antique-gold Shoulder Chain'
          : 'Reinforced Vegan-Leather / Handloom Shoulder Straps & Brass YKK Zipper',
      },
      { label: 'Fits Inside', value: 'All Flagship Smartphones (up to 6.9"), Keys, Cards, Compact & Essentials' },
      { label: 'Net Weight & HSN', value: '~360 Grams | HSN 4202 (5% GST Inclusive)' },
      {
        label: 'Country of Origin & Atelier',
        value: 'India — Handcrafted at Zariya Jaipur Heritage Guild, Johari Bazar, Jaipur 302003',
      },
    ];
  }

  const isDupatta = lowerName.includes('dupatta');
  return [
    {
      label: isDupatta ? 'Drape Fabric' : 'Base Craft & Metal',
      value: isDupatta
        ? 'Handwoven Chanderi / Modal Silk with Woven Zari Pallu'
        : 'Hypoallergenic Lead-Free Brass Alloy with 22K Micron Gold / Oxidized Silver Finish',
    },
    {
      label: 'Heritage Technique',
      value: isDupatta
        ? 'Handblock Ajrakh / Banarasi Kadwa Zari Border with Hand-Knotted Latkans'
        : 'Bikaneri Uncut Jadau Polki Glass Stones & Hand-Painted Jaipur Firozi Meenakari',
    },
    {
      label: 'Dimensions / Fit',
      value: isDupatta
        ? 'Full 2.25m – 2.50m Length x 36 Inches Width'
        : 'Adjustable Silk Dori Sarafa Lock / Comfort Push-Back Ear Post',
    },
    { label: 'Skin & Wear Safety', value: '100% Nickel-Free & Lead-Free | Featherlight All-Day Festive Comfort' },
    { label: 'Net Weight & HSN', value: '~140 Grams | HSN 7117 (5% GST Inclusive)' },
    {
      label: 'Country of Origin & Atelier',
      value: 'India — Handcrafted at Zariya Jaipur Heritage Guild, Johari Bazar, Jaipur 302003',
    },
  ];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lang, addToCart, wishlist, toggleWishlist, t } = useStore();

  const productId = Number(params?.id);
  const [product, setProduct] = useState<Product | undefined>(() => getProductById(productId));
  const [allProducts, setAllProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);

  const [selectedSize, setSelectedSize] = useState<string>(
    product?.sizes?.includes('M') ? 'M' : product?.sizes?.[0] || 'Free Size'
  );
  const [activeImage, setActiveImage] = useState<string>(
    product?.image_url || '/products/kurti1.jpg'
  );
  const [showZoomLightbox, setShowZoomLightbox] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string>('specs');
  const [copiedLink, setCopiedLink] = useState(false);

  const [qty, setQty] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);

  // Pincode delivery checker (Store Owner Serviceability Engine)
  const [pinInput, setPinInput] = useState('302001');
  const [pinEtaDays, setPinEtaDays] = useState<{ min: number; max: number }>({ min: 2, max: 3 });
  const [pinResult, setPinResult] = useState<string | null>(
    lang === 'hi'
      ? 'पिन 302001 (Jaipur, Rajasthan) पर डिलीवरी उपलब्ध है — Delhivery Express'
      : 'Serviceable at PIN 302001 (Jaipur, Rajasthan) — Free Insured Delivery via Delhivery Express'
  );
  const [pinServiceable, setPinServiceable] = useState<boolean>(true);
  const [pinChecking, setPinChecking] = useState<boolean>(false);

  // Direct Product Inquiry to Store Owner
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inqName, setInqName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqMessage, setInqMessage] = useState('');
  const [inqSubmitting, setInqSubmitting] = useState(false);
  const [inqError, setInqError] = useState('');
  const [inqSuccess, setInqSuccess] = useState<{
    message: string;
    whatsappUrl: string;
    mailtoUrl: string;
  } | null>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revName, setRevName] = useState('');
  const [revCity, setRevCity] = useState('Jaipur, RJ');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [reviewSort, setReviewSort] = useState<'featured' | 'newest' | 'highest' | 'lowest'>('featured');

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          setProduct(d.product);
          setSelectedSize(
            d.product.sizes?.includes('M') ? 'M' : d.product.sizes?.[0] || 'Free Size'
          );
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

    // Record & load Recently Viewed products in localStorage
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const parsed: number[] = raw ? JSON.parse(raw) : [];
      const cleaned = [productId, ...parsed.filter((id) => id !== productId && Number.isFinite(id))].slice(0, 8);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(cleaned));
      setRecentlyViewedIds(cleaned.filter((id) => id !== productId));
    } catch {
      // ignore storage errors
    }
  }, [productId]);

  // Compute 3-stage delivery timeline dates (Order Placed -> Order Ready -> Delivered)
  const timelineDates = useMemo(() => {
    const now = new Date();
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const readyStart = new Date(now);
    readyStart.setDate(now.getDate() + 1);
    const readyEnd = new Date(now);
    readyEnd.setDate(now.getDate() + 2);
    const delivStart = new Date(now);
    delivStart.setDate(now.getDate() + Math.max(2, pinEtaDays.min));
    const delivEnd = new Date(now);
    delivEnd.setDate(now.getDate() + Math.max(3, pinEtaDays.max));

    return {
      placed: fmt(now),
      ready: `${fmt(readyStart)} - ${fmt(readyEnd)}`,
      delivered: `${fmt(delivStart)} - ${fmt(delivEnd)}`,
    };
  }, [pinEtaDays]);

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

  // Size-based dynamic price calculation
  const sizeQuote = getProductPriceForSize(product, selectedSize);
  const activePricePaise = sizeQuote.price_paise;
  const activeOriginalPaise = sizeQuote.original_price_paise;
  const discountPct =
    activeOriginalPaise && activeOriginalPaise > activePricePaise
      ? Math.round(((activeOriginalPaise - activePricePaise) / activeOriginalPaise) * 100)
      : 0;

  const galleryImages =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image_url, product.hover_image_url].filter(Boolean) as string[];

  const specs = buildGarmentSpecifications(product);

  const related = allProducts
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  const recentlyViewedProducts = recentlyViewedIds
    .map((id) => allProducts.find((item) => item.id === id))
    .filter((item): item is Product => Boolean(item))
    .slice(0, 4);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart({
      id: product.id,
      name: product.name,
      name_hi: product.name_hi,
      price_paise: activePricePaise,
      qty,
      size: sizeQuote.size,
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
      price_paise: activePricePaise,
      qty,
      size: sizeQuote.size,
      image_url: product.image_url,
      category: product.category,
    });
    router.push('/checkout');
  };

  const handleCopyProductLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    }
  };

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinInput.replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) {
      setPinServiceable(false);
      setPinResult(
        lang === 'hi'
          ? 'कृपया वैध 6-अंकों का भारतीय पिनकोड दर्ज करें।'
          : 'Please enter a valid 6-digit Indian PIN code.'
      );
      return;
    }

    setPinChecking(true);
    try {
      const res = await fetch(`/api/delivery/check?pincode=${encodeURIComponent(cleanPin)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      const ok = Boolean(data.valid && data.serviceable);
      setPinServiceable(ok);
      if (data.eta_days_min && data.eta_days_max) {
        setPinEtaDays({ min: data.eta_days_min, max: data.eta_days_max });
      }
      setPinResult(lang === 'hi' && data.message_hi ? data.message_hi : data.message_en);
    } catch {
      const valid = validatePincode(cleanPin);
      setPinServiceable(valid);
      setPinResult(
        valid
          ? `Delivery available to PIN ${cleanPin}`
          : 'Please enter a valid 6-digit Indian PIN code.'
      );
    } finally {
      setPinChecking(false);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setInqError('');
    setInqSuccess(null);
    setInqSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          selectedSize,
          customerName: inqName.trim(),
          customerPhone: inqPhone.replace(/\D/g, '').slice(0, 10),
          customerEmail: inqEmail.trim(),
          pincode: pinInput.replace(/\D/g, '').slice(0, 6),
          message: inqMessage.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setInqError(data.error || 'Could not send inquiry. Please verify your details.');
        return;
      }
      setInqSuccess({
        message:
          lang === 'hi'
            ? 'आपका संदेश स्टोर ओनर (prakashgothwal370@gmail.com) को भेज दिया गया है।'
            : 'Your inquiry has been dispatched directly to the Store Owner (prakashgothwal370@gmail.com).',
        whatsappUrl: data.ownerWhatsAppUrl,
        mailtoUrl: data.ownerMailtoUrl,
      });
      setInqMessage('');
    } catch {
      setInqError('Failed to send inquiry to store owner.');
    } finally {
      setInqSubmitting(false);
    }
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
        <nav className="text-xs text-stone-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-rose-800">
            {t('allCategories')}
          </Link>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-stone-900 font-semibold">{displayName}</span>
        </nav>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image & Interactive Gallery with Full-Screen Zoom Lightbox */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] rounded-2xl bg-stone-100 overflow-hidden border border-stone-200/60 group">
              <img
                src={activeImage || product.image_url}
                alt={displayName}
                onClick={() => setShowZoomLightbox(true)}
                className="w-full h-full object-cover transition-all duration-500 cursor-zoom-in group-hover:scale-[1.03]"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {discountPct > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-900 text-amber-200 shadow w-fit">
                    -{discountPct}% OFF
                  </span>
                )}
                {product.badge && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-950/90 text-white shadow w-fit">
                    {lang === 'hi' && product.badge_hi ? product.badge_hi : product.badge}
                  </span>
                )}
              </div>

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

              {/* High-Resolution Zoom In Button (Inspired by thestoreofbufani.com) */}
              <button
                type="button"
                onClick={() => setShowZoomLightbox(true)}
                className="absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-stone-950 text-stone-900 hover:text-amber-300 text-xs font-bold shadow-md border border-stone-200 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 10.5a7.5 7.5 0 0013.15 6.15zM10.5 7.5v6m3-3h-6" />
                </svg>
                <span>{lang === 'hi' ? 'ज़ूम इन (Zoom In)' : 'Zoom In'}</span>
              </button>
            </div>

            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {galleryImages.map((imgUrl, idx) => (
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
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800">
                    {product.category === 'kurti'
                      ? t('categoryKurti')
                      : product.category === 'bag'
                      ? t('categoryBag')
                      : t('categoryAccessory')}
                  </span>
                  <span className="text-xs font-mono text-stone-500">SKU: {product.sku}</span>
                </div>
                <span className="text-sm font-semibold text-amber-800">
                  {product.rating.toFixed(1)} / 5 ({reviews.length || product.reviews_count} reviews)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-stone-900 mb-3">
                {displayName}
              </h1>

              {/* Sale Price / Regular Price (MRP) & Savings Pill */}
              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                <span className="text-3xl font-extrabold text-rose-900">
                  {rupees(activePricePaise)}
                </span>
                {activeOriginalPaise && activeOriginalPaise > activePricePaise && (
                  <>
                    <span className="text-base text-stone-400 line-through">
                      {t('mrpLabel')}: {rupees(activeOriginalPaise)}
                    </span>
                    <span className="text-xs font-extrabold text-rose-900 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      Save {rupees(activeOriginalPaise - activePricePaise)} ({discountPct}% OFF)
                    </span>
                  </>
                )}
                <span className="text-xs font-mono font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  Size: {formatEthnicSizeLabel(selectedSize, product.category)}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Shipping & 5% GST Included (HSN {product.category === 'kurti' ? '6204' : product.category === 'bag' ? '4202' : '7117'})
                </span>
              </div>

              {/* Liksha Clothing 3-Pill Guarantee Strip + Recent Sales & Dispatch Cut-Off Bar */}
              <div className="mb-5 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-bold text-stone-800">
                  <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <span>Express Delivery on Prepaid</span>
                    <span className="text-[10px] font-mono text-emerald-700">PRIORITY</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <span>4–7 Days Delivery Time</span>
                    <span className="text-[10px] font-mono text-stone-500">INSURED</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <span>100% Premium Fabric</span>
                    <span className="text-[10px] font-mono text-rose-900">CERTIFIED</span>
                  </div>
                </div>

                <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-extrabold text-rose-950">
                    {((product.id * 7) % 14) + 6} sold in last 12 hours
                  </span>
                  <span className="text-stone-700 font-medium">
                    Order in the next <strong className="text-stone-950">4 hours 35 minutes</strong> to get it by{' '}
                    <strong className="text-emerald-900 underline">{timelineDates.delivered}</strong>
                  </span>
                </div>
              </div>

              <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-5">
                {displayDesc}
              </p>

              {/* Size Selector with Bust Measurements (S [36]..XXL [44]) + Size Guide Modal Trigger */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                    {t('selectSize')} {product.category === 'kurti' ? '(Bust in Inches)' : ''}
                  </label>
                  {product.category === 'kurti' && (
                    <button
                      type="button"
                      onClick={() => setShowSizeModal(true)}
                      className="text-xs font-bold text-rose-800 hover:underline flex items-center gap-1"
                    >
                      {t('sizeGuide')} (S [36] – XXL [44])
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const szPrice = getProductPriceForSize(product, size).price_paise;
                    const label = formatEthnicSizeLabel(size, product.category);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors flex flex-col items-center min-w-[78px] ${
                          selectedSize === size
                            ? 'bg-stone-950 text-amber-300 border-stone-950 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900'
                        }`}
                      >
                        <span className="font-bold">{label}</span>
                        <span
                          className={`text-[10px] font-mono ${
                            selectedSize === size ? 'text-amber-200' : 'text-stone-500'
                          }`}
                        >
                          {rupees(szPrice)}
                        </span>
                      </button>
                    );
                  })}
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

              {/* Pincode Delivery Date, Store Owner Serviceability & 3-Stage Order Timeline Bar */}
              <div className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    {lang === 'hi'
                      ? 'पिनकोड और डिलीवरी उपलब्धता जाँचें'
                      : 'Check Delivery PIN Code & Serviceability'}
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    India Post 6-Digit Verified
                  </span>
                </div>
                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="302001"
                    className="w-36 px-3 py-1.5 rounded-xl border border-stone-300 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="submit"
                    disabled={pinChecking}
                    className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {pinChecking ? 'Checking...' : t('checkDelivery')}
                  </button>
                </form>
                {pinResult && (
                  <p
                    className={`text-xs font-semibold ${
                      pinServiceable ? 'text-emerald-800' : 'text-rose-700'
                    }`}
                  >
                    {pinResult}
                  </p>
                )}

                {/* 3-Step Visual Delivery Timeline Bar (Inspired by thestoreofbufani.com) */}
                {pinServiceable && (
                  <div className="pt-3 border-t border-stone-200/80 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-white border border-stone-200/80">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-rose-900">
                        {lang === 'hi' ? 'ऑर्डर बुक' : 'Order Placed'}
                      </p>
                      <p className="text-xs font-bold text-stone-900 mt-0.5">
                        {timelineDates.placed}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-stone-200/80">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800">
                        {lang === 'hi' ? 'डिस्पैच तैयार' : 'Order Ready'}
                      </p>
                      <p className="text-xs font-bold text-stone-900 mt-0.5">
                        {timelineDates.ready}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800">
                        {lang === 'hi' ? 'अनुमानित डिलीवरी' : 'Delivered'}
                      </p>
                      <p className="text-xs font-bold text-emerald-950 mt-0.5">
                        {timelineDates.delivered}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-stone-200">
              {isOutOfStock ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowInquiryModal(true);
                    setInqMessage(
                      `Please notify me when ${product.name} (${product.sku}) in size ${selectedSize} is back in stock or available for Pre-Order.`
                    );
                  }}
                  className="w-full py-3.5 px-6 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-300 font-extrabold text-sm uppercase tracking-wider shadow-sm transition"
                >
                  Notify Me When Available / Request Pre-Order
                </button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`py-3.5 px-6 rounded-xl font-bold text-sm border transition-colors ${
                      addedFeedback
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-rose-800 border-rose-800 hover:bg-rose-50'
                    }`}
                  >
                    {addedFeedback ? t('addedToCart') : t('addToCart')}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="py-3.5 px-6 rounded-xl font-bold text-sm bg-rose-800 hover:bg-rose-900 text-white shadow-sm transition-colors"
                  >
                    Buy It Now →
                  </button>
                </div>
              )}

              {/* Direct Store Owner Item Inquiry + WhatsApp Share + Copy Link */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowInquiryModal((v) => !v);
                    setInqError('');
                  }}
                  className="sm:col-span-2 py-2.5 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <span>
                    {lang === 'hi'
                      ? 'इस आइटम के बारे में स्टोर ओनर से पूछें'
                      : 'Contact Store Owner About Item'}
                  </span>
                </button>
                <a
                  href={buildWhatsAppOrderUrl({
                    id: product.id,
                    name: product.name,
                    price_paise: activePricePaise,
                    size: selectedSize,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <span>{t('askOnWhatsApp')}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyProductLink}
                  className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Direct Store Owner Product Inquiry Drawer */}
              {showInquiryModal && (
                <div className="mt-3 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                        {lang === 'hi'
                          ? 'स्टोर ओनर को सीधा संदेश भेजें (Direct Store Owner Inquiry)'
                          : 'Direct Inquiry to Store Owner'}
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Item: {product.name} ({product.sku}) — Size {selectedSize} ({rupees(activePricePaise)})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInquiryModal(false)}
                      className="text-xs font-bold text-stone-500 hover:text-stone-900"
                    >
                      Close
                    </button>
                  </div>

                  {inqError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                      {inqError}
                    </div>
                  )}

                  {inqSuccess ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2.5">
                      <p className="text-xs font-bold text-emerald-900">{inqSuccess.message}</p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={inqSuccess.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                        >
                          Send Directly on Owner WhatsApp
                        </a>
                        <a
                          href={inqSuccess.mailtoUrl}
                          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold"
                        >
                          Open Direct Email to Owner
                        </a>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitInquiry} className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          value={inqName}
                          onChange={(e) => setInqName(e.target.value)}
                          placeholder={lang === 'hi' ? 'आपका नाम *' : 'Your Full Name *'}
                          className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                        />
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={inqPhone}
                          onChange={(e) => setInqPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder={lang === 'hi' ? '10-अंकों का मोबाइल नंबर *' : '10-Digit Mobile Number *'}
                          className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono bg-white"
                        />
                      </div>
                      <input
                        type="email"
                        value={inqEmail}
                        onChange={(e) => setInqEmail(e.target.value)}
                        placeholder={lang === 'hi' ? 'आपकी ईमेल आईडी (वैकल्पिक)' : 'Your Email Address (Optional)'}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                      />
                      <textarea
                        rows={3}
                        required
                        value={inqMessage}
                        onChange={(e) => setInqMessage(e.target.value)}
                        placeholder={
                          lang === 'hi'
                            ? 'इस आइटम के साइज, फैब्रिक, कस्टमाइजेशन या बल्क ऑर्डर के बारे में अपना सवाल लिखें...'
                            : 'Ask the store owner about fabric, custom stitching, bulk availability, or delivery timeline for this item...'
                        }
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                      />
                      <button
                        type="submit"
                        disabled={inqSubmitting}
                        className="w-full py-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-300 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                      >
                        {inqSubmitting
                          ? 'Sending to Store Owner...'
                          : lang === 'hi'
                          ? 'स्टोर ओनर को पूछताछ भेजें'
                          : 'Send Item Inquiry to Store Owner'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Expandable Product Specification, Wash Care & Shipping Accordions (Bufani / Jaypore / Bunaai Pattern) */}
              <div className="pt-4 space-y-2">
                {[
                  {
                    id: 'specs',
                    title:
                      lang === 'hi'
                        ? 'उत्पाद विवरण और कारीगरी (Description & Specifications)'
                        : 'Description & Garment Specifications',
                    content: (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {specs.map((row) => (
                            <div
                              key={row.label}
                              className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80"
                            >
                              <p className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500">
                                {row.label}
                              </p>
                              <p className="font-semibold text-stone-900 mt-0.5">{row.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Model Info & Perfect For Occasion Tags (Liksha Clothing Pattern) */}
                        <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/70 space-y-2">
                          {product.category === 'kurti' && (
                            <p className="text-stone-800 font-semibold">
                              <strong className="uppercase tracking-wider text-[10px] text-rose-900 mr-2">
                                Model & Fit Info:
                              </strong>
                              Model Height 5&apos;5&quot; wearing Size M [38] — Standard Stitched Ready-to-Wear Sizing
                            </p>
                          )}
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-extrabold text-rose-900 mb-1.5">
                              Perfect For Occasions:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                'Festive Occasions',
                                'Wedding Guests',
                                'Sangeet & Mehendi',
                                'Evening Functions',
                                'Traditional Celebrations',
                              ].map((occ) => (
                                <span
                                  key={occ}
                                  className="px-2.5 py-1 rounded-full bg-white border border-rose-200 text-[11px] font-bold text-stone-800"
                                >
                                  {occ}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'care',
                    title:
                      lang === 'hi'
                        ? 'फैब्रिक और वॉश केयर (Fabric & Wash Care)'
                        : 'Fabric & Wash Care Instructions',
                    content: (
                      <ul className="space-y-1.5 text-xs text-stone-600 list-disc pl-4">
                        <li>
                          For Zardozi, Chanderi Silk, Bridal Velvet & Jadau pieces: Dry clean only or store in the provided breathable muslin dust bag.
                        </li>
                        <li>
                          For Sanganeri / Bagru Hand-Block Mulmul & Cambric Cotton: Gentle hand wash separately in cold water using mild liquid detergent.
                        </li>
                        <li>
                          Do not bleach, wring, or soak. Dry in shade away from direct sunlight to preserve natural vegetable dyes. Warm iron on reverse side.
                        </li>
                      </ul>
                    ),
                  },
                  {
                    id: 'shipping',
                    title:
                      lang === 'hi'
                        ? 'शिपिंग और डिलीवरी पॉलिसी (Shipping & Dispatch Policy)'
                        : 'Shipping & Dispatch Policy',
                    content: (
                      <div className="space-y-1.5 text-xs text-stone-600 leading-relaxed">
                        <p>
                          Every order is dispatched from our Johari Bazar, Jaipur Atelier within 24–48 hours via insured Delhivery / BlueDart Surface & Air Express.
                        </p>
                        <p>
                          Once confirmed, your official CGST Rule 46(b) Tax Invoice and 12-digit Courier AWB Tracking ID are emailed immediately and dispatched to the Store Owner for priority fulfillment.
                        </p>
                      </div>
                    ),
                  },
                  {
                    id: 'exchange',
                    title:
                      lang === 'hi'
                        ? 'एक्सचेंज और CCTV क्वालिटी गारंटी (Exchange & Quality Guarantee)'
                        : '7-Day Size Exchange & CCTV Quality Guarantee',
                    content: (
                      <div className="space-y-1.5 text-xs text-stone-600 leading-relaxed">
                        <p>
                          Every garment, handbag, and jewellery piece undergoes a 3-point artisan quality inspection and is packed under 24x7 CCTV surveillance at our Jaipur warehouse.
                        </p>
                        <p>
                          Easy 7-day size exchange or replacement in case of any transit damage (please keep a short parcel unboxing video for instant priority resolution).
                        </p>
                      </div>
                    ),
                  },
                ].map((acc) => {
                  const isOpen = openAccordion === acc.id;
                  return (
                    <div
                      key={acc.id}
                      className="rounded-2xl border border-stone-200 overflow-hidden bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenAccordion(isOpen ? '' : acc.id)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between gap-2 hover:bg-stone-50 transition"
                      >
                        <span className="text-xs sm:text-sm font-extrabold text-stone-900">
                          {acc.title}
                        </span>
                        <span className="text-sm font-mono font-bold text-rose-900">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-stone-100">
                          {acc.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Verified Customer Reviews Section with 5-Star Histogram & Sort (Liksha Clothing Pattern) */}
        <section className="mt-10 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                {t('customerReviews')} ({reviews.length || product.reviews_count})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                100% Verified Boutique Buyers | Average Rating {product.rating.toFixed(1)} / 5.0
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={reviewSort}
                onChange={(e) =>
                  setReviewSort(e.target.value as 'featured' | 'newest' | 'highest' | 'lowest')
                }
                aria-label="Sort reviews"
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="newest">Sort by: Newest</option>
                <option value="highest">Sort by: Highest Ratings</option>
                <option value="lowest">Sort by: Lowest Ratings</option>
              </select>
              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition"
              >
                {t('writeReview')}
              </button>
            </div>
          </div>

          {/* 5-Star Rating Breakdown Histogram */}
          <div className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-stone-200 pb-4 md:pb-0 md:pr-6">
              <p className="text-3xl sm:text-4xl font-serif font-extrabold text-stone-900">
                {product.rating.toFixed(1)} <span className="text-base font-sans text-stone-500">/ 5.0</span>
              </p>
              <p className="text-xs font-semibold text-emerald-800 mt-1">
                Based on {reviews.length || product.reviews_count} Verified Purchases
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                98% of patrons recommend this handcrafted piece
              </p>
            </div>
            <div className="md:col-span-8 space-y-1.5 text-xs">
              {[
                { star: 5, pct: 82 },
                { star: 4, pct: 14 },
                { star: 3, pct: 4 },
                { star: 2, pct: 0 },
                { star: 1, pct: 0 },
              ].map((bar) => (
                <div key={bar.star} className="flex items-center gap-3">
                  <span className="w-12 font-mono font-bold text-stone-700">{bar.star} Star</span>
                  <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-stone-500">{bar.pct}%</span>
                </div>
              ))}
            </div>
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
                <option value={5}>5 / 5 Excellent</option>
                <option value={4}>4 / 5 Very Good</option>
                <option value={3}>3 / 5 Good</option>
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
            {[...reviews]
              .sort((a, b) => {
                if (reviewSort === 'newest') {
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                if (reviewSort === 'highest') return b.rating - a.rating;
                if (reviewSort === 'lowest') return a.rating - b.rating;
                return 0;
              })
              .map((rev) => (
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
                    <span className="text-emerald-700 font-semibold">Verified Purchase | {rev.city}</span>
                    <span>{new Date(rev.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Similar Ethnic Picks */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-serif font-bold text-stone-900 mb-6">
              {lang === 'hi' ? 'मिलते-जुलते उत्पाद (Similar Ethnic Picks)' : 'Similar Ethnic Picks'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {related.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed Products (Inspired by thestoreofbufani.com) */}
        {recentlyViewedProducts.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-rose-900">
                  YOUR BROWSING HISTORY
                </p>
                <h2 className="text-xl font-serif font-bold text-stone-900 mt-0.5">
                  {lang === 'hi' ? 'हाल ही में देखे गए उत्पाद (Recently Viewed)' : 'Recently Viewed'}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {recentlyViewedProducts.map((item) => (
                <ProductCard key={item.id} p={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* High-Resolution Studio Image Zoom Lightbox Modal */}
      {showZoomLightbox && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setShowZoomLightbox(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-stone-950 text-white">
              <div>
                <p className="text-xs font-serif font-bold text-amber-300">{displayName}</p>
                <p className="text-[11px] text-stone-400 font-mono">
                  {product.sku} — {rupees(activePricePaise)} ({formatEthnicSizeLabel(selectedSize, product.category)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowZoomLightbox(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto bg-stone-100 flex items-center justify-center">
              <img
                src={activeImage || product.image_url}
                alt={displayName}
                className="w-full h-auto object-contain"
              />
            </div>
            {galleryImages.length > 1 && (
              <div className="p-3 bg-stone-950 flex items-center justify-center gap-3">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={`zoom-${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-14 h-16 rounded-lg overflow-hidden border-2 transition ${
                      (activeImage || product.image_url) === imgUrl
                        ? 'border-amber-400 scale-105'
                        : 'border-stone-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                  <td className="p-2.5 font-bold">S [36]</td>
                  <td className="p-2.5">36&quot;</td>
                  <td className="p-2.5">32&quot;</td>
                  <td className="p-2.5">38&quot;</td>
                  <td className="p-2.5">44&quot;</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">M [38]</td>
                  <td className="p-2.5">38&quot;</td>
                  <td className="p-2.5">34&quot;</td>
                  <td className="p-2.5">40&quot;</td>
                  <td className="p-2.5">44&quot;</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">L [40]</td>
                  <td className="p-2.5">40&quot;</td>
                  <td className="p-2.5">36&quot;</td>
                  <td className="p-2.5">42&quot;</td>
                  <td className="p-2.5">45&quot;</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">XL [42]</td>
                  <td className="p-2.5">42&quot;</td>
                  <td className="p-2.5">38&quot;</td>
                  <td className="p-2.5">44&quot;</td>
                  <td className="p-2.5">45&quot;</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">XXL [44]</td>
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

      {/* Sticky Bottom Quick-Purchase Bar (Inspired by Liksha Clothing Product Page) */}
      <div className="sticky bottom-14 md:bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={product.image_url}
              alt={displayName}
              className="w-11 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-serif font-bold text-stone-900 truncate max-w-[200px] sm:max-w-md">
                {displayName}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-rose-900">
                  {rupees(activePricePaise)}
                </span>
                {activeOriginalPaise && activeOriginalPaise > activePricePaise && (
                  <span className="text-[11px] text-stone-400 line-through">
                    {rupees(activeOriginalPaise)}
                  </span>
                )}
                <span className="text-[10px] font-mono text-stone-600">
                  {formatEthnicSizeLabel(selectedSize, product.category)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              aria-label="Select size"
              className="hidden sm:block px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800"
            >
              {product.sizes.map((sz) => (
                <option key={`sticky-${sz}`} value={sz}>
                  {formatEthnicSizeLabel(sz, product.category)} — {rupees(getProductPriceForSize(product, sz).price_paise)}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="px-4 py-2 rounded-xl border border-rose-900 text-rose-900 hover:bg-rose-50 text-xs font-extrabold uppercase tracking-wider disabled:opacity-40"
            >
              {addedFeedback ? t('addedToCart') : t('addToCart')}
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs font-extrabold uppercase tracking-wider disabled:opacity-40"
            >
              Buy It Now
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
