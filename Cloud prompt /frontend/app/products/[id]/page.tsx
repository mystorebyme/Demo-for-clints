'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import { DEMO_PRODUCTS, enrichProduct, Product } from '../../../lib/catalog';
import { API_URL, rupees, useCart, useT } from '../../../lib/store';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { t, lang } = useT();
  const router = useRouter();
  const add = useCart((s) => s.add);

  const productId = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('Free Size');
  const [qty, setQty] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products/${productId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.product) {
            const enriched = enrichProduct(data.product);
            setProduct(enriched);
            setActiveImage(enriched.image_url);
            setSelectedSize((enriched.sizes && enriched.sizes[0]) || 'Free Size');
          }
        } else {
          const fallback = DEMO_PRODUCTS.find((p) => p.id === productId) || null;
          if (!cancelled) {
            setProduct(fallback);
            if (fallback) {
              setActiveImage(fallback.image_url);
              setSelectedSize((fallback.sizes && fallback.sizes[0]) || 'Free Size');
            }
          }
        }
        const listRes = await fetch(`${API_URL}/api/products`, { cache: 'no-store' });
        if (listRes.ok) {
          const listData = await listRes.json();
          if (!cancelled && Array.isArray(listData.products)) {
            setAllProducts(listData.products.map((p: Product) => enrichProduct(p)));
          }
        }
      } catch {
        const fallback = DEMO_PRODUCTS.find((p) => p.id === productId) || null;
        if (!cancelled && fallback) {
          setProduct(fallback);
          setActiveImage(fallback.image_url);
          setSelectedSize((fallback.sizes && fallback.sizes[0]) || 'Free Size');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const related = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  }, [product, allProducts]);

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500 animate-pulse">
        {t('loading')}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border p-8 text-center space-y-4 my-8">
        <h1 className="text-xl font-bold text-gray-900">{t('notFoundTitle')}</h1>
        <p className="text-sm text-gray-600">{t('notFoundDesc')}</p>
        <Link href="/" className="inline-block bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
          ← {t('backToCatalog')}
        </Link>
      </div>
    );
  }

  const title = lang === 'hi' && product.name_hi ? product.name_hi : product.name;
  const description =
    lang === 'hi' && product.description_hi ? product.description_hi : product.description;
  const fabric =
    lang === 'hi' && product.fabric_or_material_hi
      ? product.fabric_or_material_hi
      : product.fabric_or_material;
  const care =
    lang === 'hi' && product.care_instructions_hi
      ? product.care_instructions_hi
      : product.care_instructions;

  const gallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image_url];
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size'];
  const maxQty = Math.min(10, Math.max(1, product.stock));

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    add(product, qty, selectedSize);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const handleBuyNow = () => {
    if (product.stock <= 0) return;
    add(product, qty, selectedSize);
    router.push('/cart');
  };

  return (
    <div className="space-y-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-brand">
          {t('navHome')}
        </Link>
        <span>/</span>
        <Link href={`/?category=${product.category}#catalog`} className="hover:text-brand">
          {t(product.category)}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{title}</span>
      </nav>

      {/* Main Product Section */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Image Gallery */}
        <div className="md:col-span-6 space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(activeImage || product.image_url).replace(/\.webp$/i, '.svg')}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1" role="group" aria-label="Product Image Gallery">
              {gallery.map((imgUrl, idx) => {
                const normalized = imgUrl.replace(/\.webp$/i, '.svg');
                const isSelected = (activeImage || product.image_url).replace(/\.webp$/i, '.svg') === normalized;
                return (
                  <button
                    key={imgUrl}
                    type="button"
                    onClick={() => setActiveImage(normalized)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      isSelected ? 'border-brand ring-2 ring-brand/20' : 'border-gray-200 opacity-75 hover:opacity-100'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={normalized} alt={`${title} view ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Details & Actions */}
        <div className="md:col-span-6 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider bg-pink-50 text-brand border border-pink-200 px-3 py-1 rounded-full">
              {t(product.category)}
            </span>
            <span className="text-xs font-mono text-gray-500">
              {t('productCode')}: #PRD-{String(product.id).padStart(3, '0')} • {t('demoBadge')}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{title}</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-brand">
                {rupees(product.price_paise)}
              </span>
              {product.stock === 0 ? (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                  {t('outOfStock')}
                </span>
              ) : product.stock <= 10 ? (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                  {t('lowStock', { count: product.stock })}
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  {t('inStock')} ({product.stock})
                </span>
              )}
            </div>
          </div>

          {description && (
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
          )}

          {/* Size Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              {t('selectSize')}: <span className="text-brand">{selectedSize}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    selectedSize === sz
                      ? 'bg-brand text-white border-brand shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-brand'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                {t('quantity')}
              </label>
              <div className="inline-flex items-center border border-gray-300 rounded-xl bg-gray-50">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 font-bold text-lg text-gray-700 hover:bg-gray-200 rounded-l-xl"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-12 text-center font-bold text-sm" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="w-10 h-10 font-bold text-lg text-gray-700 hover:bg-gray-200 rounded-r-xl"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={product.stock === 0}
              onClick={handleAddToCart}
              className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm transition-colors ${
                product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : addedFeedback
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand text-white hover:bg-brand-dark shadow-sm'
              }`}
            >
              {product.stock === 0 ? t('outOfStock') : addedFeedback ? t('addedToCart') : t('addToCart')}
            </button>

            {product.stock > 0 && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm border-2 border-brand text-brand hover:bg-brand-light transition-colors"
              >
                {t('buyNow')} →
              </button>
            )}
          </div>

          {/* Fabric & Care Details */}
          <div className="border-t border-gray-200 pt-4 mt-auto space-y-3 text-xs sm:text-sm">
            {fabric && (
              <div>
                <span className="font-bold text-gray-900">{t('fabricMaterial')}: </span>
                <span className="text-gray-600">{fabric}</span>
              </div>
            )}
            {care && (
              <div>
                <span className="font-bold text-gray-900">{t('careInstructions')}: </span>
                <span className="text-gray-600">{care}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-4">
          <h2 id="related-heading" className="text-xl font-bold text-gray-900">
            {t('relatedProducts')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
