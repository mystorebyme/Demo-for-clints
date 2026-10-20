export type ProductCategory = 'kurti' | 'bag' | 'accessory';

export type Product = {
  id: number;
  sku?: string;
  name: string;
  name_hi: string;
  category: ProductCategory;
  price_paise: number;
  original_price_paise?: number;
  size_prices_paise?: Record<string, number>;
  size_original_prices_paise?: Record<string, number>;
  image_url: string;
  hover_image_url?: string;
  gallery?: string[];
  gallery_captions?: string[];
  stock: number;
  sizes: string[];
  description: string;
  description_hi: string;
  long_description?: string;
  long_description_hi?: string;
  package_contents?: string;
  package_contents_hi?: string;
  styling_notes?: string;
  fabric_or_material?: string;
  care_instructions?: string;
  origin_cluster?: string;
  rating: number;
  reviews_count: number;
  badge?: string;
  badge_hi?: string;
  featured?: boolean;
  is_demo?: boolean;
};

export type SizeMeasurementSpec = {
  sizeLabel: string;
  fitSummary: string;
  fitSummaryHi: string;
  metrics: Array<{ label: string; labelHi: string; value: string }>;
};

export function getSizeMeasurements(
  product: Pick<Product, 'category' | 'name'>,
  size: string
): SizeMeasurementSpec {
  if (product.category === 'kurti') {
    const table: Record<
      string,
      { bust: string; waist: string; hip: string; shoulder: string; length: string; sleeve: string; bottom: string }
    > = {
      XS: { bust: '34 in (86 cm)', waist: '30 in (76 cm)', hip: '36 in (91 cm)', shoulder: '13.5 in', length: '45 in', sleeve: '16.5 in', bottom: '37 in' },
      S: { bust: '36 in (91 cm)', waist: '32 in (81 cm)', hip: '38 in (96 cm)', shoulder: '14.0 in', length: '45 in', sleeve: '17.0 in', bottom: '38 in' },
      M: { bust: '38 in (96 cm)', waist: '34 in (86 cm)', hip: '40 in (101 cm)', shoulder: '14.5 in', length: '46 in', sleeve: '17.0 in', bottom: '38 in' },
      L: { bust: '40 in (101 cm)', waist: '36 in (91 cm)', hip: '42 in (106 cm)', shoulder: '15.0 in', length: '46 in', sleeve: '17.5 in', bottom: '38.5 in' },
      XL: { bust: '42 in (106 cm)', waist: '38 in (96 cm)', hip: '44 in (112 cm)', shoulder: '15.5 in', length: '46.5 in', sleeve: '17.5 in', bottom: '39 in' },
      XXL: { bust: '44 in (112 cm)', waist: '40 in (101 cm)', hip: '46 in (117 cm)', shoulder: '16.0 in', length: '47 in', sleeve: '18.0 in', bottom: '39 in' },
      '2XL': { bust: '44 in (112 cm)', waist: '40 in (101 cm)', hip: '46 in (117 cm)', shoulder: '16.0 in', length: '47 in', sleeve: '18.0 in', bottom: '39 in' },
      '3XL': { bust: '46 in (117 cm)', waist: '42 in (106 cm)', hip: '48 in (122 cm)', shoulder: '16.5 in', length: '47 in', sleeve: '18.0 in', bottom: '39.5 in' },
    };
    const m = table[size] || table.M;
    return {
      sizeLabel: `${size} [Bust ${m.bust.slice(0, 2)}]`,
      fitSummary: `Ready-to-wear stitched garment with 1.5 inch inner seam margin for easy future alteration.`,
      fitSummaryHi: `रेडी-टू-वियर सिला हुआ कुर्ता, अंदर 1.5 इंच अतिरिक्त मार्जिन के साथ।`,
      metrics: [
        { label: 'Bust', labelHi: 'बस्ट (छाती)', value: m.bust },
        { label: 'Waist', labelHi: 'कमर', value: m.waist },
        { label: 'Hip', labelHi: 'हिप', value: m.hip },
        { label: 'Shoulder', labelHi: 'कंधा', value: m.shoulder },
        { label: 'Kurta Length', labelHi: 'कुर्ता लंबाई', value: m.length },
        { label: 'Sleeve Length', labelHi: 'आस्तीन', value: m.sleeve },
        { label: 'Bottom Length', labelHi: 'पैंट/पलाज़ो लंबाई', value: m.bottom },
        { label: 'Dupatta Span', labelHi: 'दुपट्टा लंबाई', value: '2.35 Meters' },
      ],
    };
  }

  if (product.category === 'bag') {
    const bagTable: Record<string, { dim: string; strap: string; cap: string; weight: string }> = {
      Compact: {
        dim: '8.5 in (L) x 6.5 in (H) x 3.0 in (W)',
        strap: '21 in Wrist / Crossbody Drop',
        cap: 'Fits Phone (up to 6.9"), Keys, Cards & Lipstick',
        weight: '290 Grams',
      },
      Regular: {
        dim: '11.5 in (L) x 9.0 in (H) x 4.0 in (W)',
        strap: '23 in Adjustable Shoulder Drop',
        cap: 'Fits Phone, Wallet, Sunglass Case, Perfume & Charger',
        weight: '380 Grams',
      },
      'Large Bridal': {
        dim: '14.0 in (L) x 11.0 in (H) x 5.0 in (W)',
        strap: '24 in Reinforced Dual Handle + Detachable Chain',
        cap: 'Fits Bridal Essentials, Makeup Kit, Shawl & iPad/Tablet',
        weight: '460 Grams',
      },
    };
    const b = bagTable[size] || bagTable.Regular;
    return {
      sizeLabel: size,
      fitSummary: 'Hand-quilted interior with zippered security pocket and dust-bag packaging.',
      fitSummaryHi: 'ज़िप पॉकेट और कॉटन डस्ट-बैग पैकेजिंग के साथ हस्तनिर्मित बैग।',
      metrics: [
        { label: 'Dimensions', labelHi: 'आकार (L x H x W)', value: b.dim },
        { label: 'Strap Drop', labelHi: 'स्ट्रैप लंबाई', value: b.strap },
        { label: 'Capacity', labelHi: 'क्षमता', value: b.cap },
        { label: 'Net Weight', labelHi: 'कुल वज़न', value: b.weight },
      ],
    };
  }

  const isDupatta = product.name.toLowerCase().includes('dupatta');
  if (isDupatta || size.endsWith('m')) {
    const lenMap: Record<string, string> = {
      '2.25m': '2.25 Meters (88 Inches)',
      '2.50m': '2.50 Meters (98 Inches)',
      '2.75m': '2.75 Meters (108 Inches Royal Bridal Span)',
    };
    return {
      sizeLabel: size,
      fitSummary: 'Full-width handwoven drape with finished Zari pallu and hand-knotted tassels.',
      fitSummaryHi: 'ज़री पल्लू और हाथ से गुंथे टैसल्स के साथ फुल-चौड़ाई दुपट्टा।',
      metrics: [
        { label: 'Drape Length', labelHi: 'दुपट्टा लंबाई', value: lenMap[size] || '2.35 Meters' },
        { label: 'Width (Panna)', labelHi: 'चौड़ाई', value: '36 Inches (91 cm)' },
        { label: 'Border Finish', labelHi: 'बॉर्डर फिनिश', value: 'Woven Zari & Hand-Knotted Latkans' },
        { label: 'Weight', labelHi: 'वज़न', value: '165 Grams (Featherlight)' },
      ],
    };
  }

  return {
    sizeLabel: size,
    fitSummary: 'Adjustable sarafa silk dori lock and comfort ear-posts suitable for all-day festive wear.',
    fitSummaryHi: 'एडजस्टेबल सराफा डोरी लॉक और आरामदायक पुश-बैक फिटिंग।',
    metrics: [
      {
        label: 'Set Configuration',
        labelHi: 'सेट विवरण',
        value:
          size === 'Complete Set'
            ? 'Necklace + Bridal Jhumka Pair + Maang Tikka + Velvet Box'
            : size === 'Bridal Pair'
            ? 'Matched Bridal Pair + Heirloom Velvet Box'
            : 'Single Statement Piece + Velvet Pouch',
      },
      { label: 'Closure / Fit', labelHi: 'फिटिंग', value: 'Adjustable Tassel Dori / Comfort Post' },
      { label: 'Base & Plating', labelHi: 'प्लेटिंग', value: '22K Micron Gold / Silver over Nickel-Free Brass' },
      { label: 'Weight', labelHi: 'वज़न', value: size === 'Single Piece' ? '38 Grams' : '76 Grams' },
    ],
  };
}

/**
 * Computes the authoritative price & MRP for a specific size of a product.
 * Ensures size-based price changes are consistent across ProductCard, Product Detail, Cart, and Server Checkout.
 */
export function getProductPriceForSize(
  product: Pick<
    Product,
    | 'category'
    | 'price_paise'
    | 'original_price_paise'
    | 'sizes'
    | 'size_prices_paise'
    | 'size_original_prices_paise'
  >,
  rawSize?: string | null
): { price_paise: number; original_price_paise: number; size: string } {
  const defaultSize = product.sizes?.[0] || 'Free Size';
  const size = rawSize && product.sizes?.includes(rawSize) ? rawSize : defaultSize;

  if (product.size_prices_paise && typeof product.size_prices_paise[size] === 'number') {
    const p = product.size_prices_paise[size];
    const orig =
      product.size_original_prices_paise?.[size] ??
      Math.round(p * ((product.original_price_paise || p * 1.35) / Math.max(100, product.price_paise)));
    return { price_paise: p, original_price_paise: orig, size };
  }

  // Deterministic size-tier price schedule so every size has its own distinct price
  const sizeOffsetsPaise: Record<string, number> = {
    XS: -8000,
    S: -4000,
    M: 0,
    L: 6000,
    XL: 12000,
    XXL: 18000,
    '2XL': 18000,
    '3XL': 24000,
    'Free Size': 0,
    Standard: 0,
    Compact: 0,
    Regular: 10000,
    'Large Bridal': 22000,
    '2.25m': 0,
    '2.50m': 14000,
    '2.75m': 26000,
    'Single Piece': 0,
    'Bridal Pair': 18000,
    'Complete Set': 36000,
  };

  const delta = sizeOffsetsPaise[size] ?? 0;
  const price_paise = Math.max(9900, product.price_paise + delta);
  const baseOrig = product.original_price_paise || Math.round(product.price_paise * 1.35);
  const original_price_paise = Math.max(price_paise, baseOrig + delta);

  return { price_paise, original_price_paise, size };
}

const CATEGORY_STUDIO_POOL: Record<ProductCategory, string[]> = {
  kurti: [
    '/products/kurti1.jpg',
    '/products/kurti1-detail.jpg',
    '/products/kurti2.jpg',
    '/products/kurti2-detail.jpg',
    '/products/kurti3.jpg',
    '/products/kurti3-detail.jpg',
    '/products/kurti4.jpg',
    '/products/kurti4-detail.jpg',
  ],
  bag: [
    '/products/bag1.jpg',
    '/products/bag1-detail.jpg',
    '/products/bag2.jpg',
    '/products/bag2-detail.jpg',
    '/products/bag3.jpg',
    '/products/bag3-detail.jpg',
    '/products/bag4.jpg',
    '/products/bag4-detail.jpg',
  ],
  accessory: [
    '/products/acc1.jpg',
    '/products/acc1-detail.jpg',
    '/products/acc2.jpg',
    '/products/acc2-detail.jpg',
    '/products/acc3.jpg',
    '/products/acc3-detail.jpg',
    '/products/acc4.jpg',
    '/products/acc4-detail.jpg',
  ],
};

function buildSixImageGallery(p: Product): string[] {
  const pool = CATEGORY_STUDIO_POOL[p.category] || CATEGORY_STUDIO_POOL.kurti;
  const seed = [
    p.image_url,
    p.hover_image_url,
    ...(Array.isArray(p.gallery) ? p.gallery : []),
  ].filter((u): u is string => Boolean(u));

  const offset = p.id % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(offset + i) % pool.length];
    if (!seed.includes(candidate)) {
      seed.push(candidate);
    }
    if (seed.length >= 6) break;
  }
  return seed.slice(0, 6);
}

function attachSizePriceMaps(p: Product): Product {
  let expandedSizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? [...p.sizes] : ['Free Size'];
  if (p.category === 'kurti' && expandedSizes.includes('M')) {
    expandedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  } else if (p.category === 'accessory') {
    if (expandedSizes.includes('2.25m') && !expandedSizes.includes('2.75m')) {
      expandedSizes = ['2.25m', '2.50m', '2.75m'];
    } else if (expandedSizes.includes('Single Piece') && !expandedSizes.includes('Complete Set')) {
      expandedSizes = ['Single Piece', 'Bridal Pair', 'Complete Set'];
    }
  }

  const withSizes: Product = { ...p, sizes: expandedSizes };
  const size_prices_paise: Record<string, number> = {};
  const size_original_prices_paise: Record<string, number> = {};
  for (const sz of expandedSizes) {
    const computed = getProductPriceForSize(withSizes, sz);
    size_prices_paise[sz] = computed.price_paise;
    size_original_prices_paise[sz] = computed.original_price_paise;
  }

  const gallery = buildSixImageGallery(withSizes);
  const gallery_captions = [
    'Front Studio View',
    'Artisan Craft & Surface Close-Up',
    'Silhouette & Flare Angle',
    'Border & Finishing Detail',
    'Complete Ensemble Drape',
    'Atelier Quality Inspection View',
  ];

  const cluster = p.origin_cluster || 'Johari Bazar Atelier, Jaipur';
  const fabric =
    p.fabric_or_material ||
    (p.category === 'kurti'
      ? '100% Pure Handloom Cotton & Silk Blend'
      : p.category === 'bag'
      ? 'Artisan Embroidered Textile & Brass Hardware'
      : '22K Micron Plated Brass & Heritage Stones');

  const long_description =
    p.long_description ||
    `${p.description} Crafted in small artisan batches at ${cluster} using ${fabric}. Every piece undergoes a 3-stage quality check for stitch density, colour fastness, and skin-friendly comfort, accompanied by an official CGST Rule 46(b) Tax Invoice and insured pan-India express delivery.`;

  const long_description_hi =
    p.long_description_hi ||
    `${p.description_hi} ${cluster} के अनुभवी कारीगरों द्वारा ${fabric} से निर्मित। हर पीस 3-स्तरीय क्वालिटी जांच के बाद आधिकारिक GST बिल और इंश्योर्ड एक्सप्रेस डिलीवरी के साथ भेजा जाता है।`;

  const package_contents =
    p.package_contents ||
    (p.category === 'kurti'
      ? p.name.toLowerCase().includes('set') || p.name.toLowerCase().includes('anarkali') || p.name.toLowerCase().includes('sharara') || p.name.toLowerCase().includes('kalidar')
        ? '1 Stitched Kurta + 1 Stitched Bottom/Palazzo + 1 Hand-Finished Dupatta + Breathable Muslin Garment Bag'
        : '1 Stitched Artisan Kurta + Extra Seam Margin + Breathable Muslin Garment Bag'
      : p.category === 'bag'
      ? '1 Handcrafted Bag/Potli + Detachable Strap/Handle + Signature Cotton Dust Bag'
      : p.name.toLowerCase().includes('dupatta')
      ? '1 Full-Length Handwoven Dupatta + Protective Muslin Storage Pouch'
      : '1 Handcrafted Jewellery Piece/Set + Heirloom Velvet Storage Box');

  const package_contents_hi =
    p.package_contents_hi ||
    (p.category === 'kurti'
      ? '1 रेडी-टू-वियर कुर्ता/सूट सेट + मलमल गारमेंट कवर'
      : p.category === 'bag'
      ? '1 हस्तनिर्मित बैग/पोटली + कॉटन डस्ट बैग'
      : '1 आभूषण/दुपट्टा पीस + प्रीमियम स्टोरेज बॉक्स');

  const styling_notes =
    p.styling_notes ||
    (p.category === 'kurti'
      ? 'Pair with Bikaneri Jadau jhumkas, an embroidered velvet potli, and handcrafted leather juttis for weddings, festive pujas, and evening celebrations.'
      : p.category === 'bag'
      ? 'Effortlessly complements Anarkali suit sets, silk sarees, and contemporary festive silhouettes while keeping your phone and essentials organized.'
      : 'Designed to frame traditional necklines and festive drapes with featherlight all-day comfort.');

  return {
    ...withSizes,
    sku:
      p.sku ||
      `ZJ-${p.category === 'kurti' ? 'KRT' : p.category === 'bag' ? 'BAG' : 'JWL'}-${String(
        p.id
      ).padStart(3, '0')}`,
    gallery,
    gallery_captions,
    long_description,
    long_description_hi,
    package_contents,
    package_contents_hi,
    styling_notes,
    size_prices_paise,
    size_original_prices_paise,
  };
}

const CORE_FLAGSHIP_PRODUCTS: Product[] = [
  // ─── KURTIS (6 Flagship Styles) ───
  {
    id: 1,
    sku: 'ZJ-KRT-001',
    name: 'Sanganeri Mulmul Hand-Block Anarkali Kurta',
    name_hi: 'सांगानेरी मलमल हैंड-ब्लॉक अनारकली कुर्ता',
    category: 'kurti',
    price_paise: 79900,
    original_price_paise: 129900,
    image_url: '/products/kurti1.jpg',
    hover_image_url: '/products/kurti1-detail.jpg',
    gallery: ['/products/kurti1.jpg', '/products/kurti1-detail.jpg'],
    stock: 50,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Hand-block printed in Sanganer on breathable 100% pure mulmul cotton. Features a 16-kali gathered flare, delicate gota-patti neckline piping, and natural vegetable dye floral motifs.',
    description_hi:
      'सांगानेर के पारंपरिक कारीगरों द्वारा 100% शुद्ध मलमल कॉटन पर हैंड-ब्लॉक प्रिंटेड 16-कली अनारकली कुर्ता। गले पर बारीक गोटा-पट्टी कार्य।',
    fabric_or_material: '100% Pure Sanganeri Mulmul Cotton',
    care_instructions: 'Gentle cold hand wash separately with mild detergent',
    origin_cluster: 'Sanganer, Jaipur (Rajasthan)',
    rating: 4.8,
    reviews_count: 142,
    badge: 'Bestseller',
    badge_hi: 'सबसे ज़्यादा बिकने वाला',
    featured: true,
    is_demo: true,
  },
  {
    id: 2,
    sku: 'ZJ-KRT-002',
    name: 'Maharani Royal Chanderi Zardozi Festive Kurta Set',
    name_hi: 'महारानी रॉयल चंदेरी ज़रदोज़ी फेस्टिव कुर्ता सेट',
    category: 'kurti',
    price_paise: 129900,
    original_price_paise: 199900,
    image_url: '/products/kurti2.jpg',
    hover_image_url: '/products/kurti2-detail.jpg',
    gallery: ['/products/kurti2.jpg', '/products/kurti2-detail.jpg'],
    stock: 30,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Woven Chanderi silk-cotton blend in auspicious sindoor crimson and gold, adorned with hand-stitched dabka zardozi embroidery on the yoke and cuffs.',
    description_hi:
      'शुभ सिंदूरी लाल और सुनहरे चंदेरी सिल्क-कॉटन में हाथ की दबका ज़रदोज़ी कढ़ाई से सजा शाही फेस्टिव कुर्ता सेट।',
    fabric_or_material: 'Chanderi Silk-Cotton with Zardozi Work',
    care_instructions: 'Dry clean only',
    origin_cluster: 'Johari Bazar Atelier, Jaipur',
    rating: 4.9,
    reviews_count: 98,
    badge: 'Bridal Edit',
    badge_hi: 'फेस्टिव स्पेशल',
    featured: true,
    is_demo: true,
  },
  {
    id: 3,
    sku: 'ZJ-KRT-003',
    name: 'Awadhi Pastel Georgette Hand-Chikankari Straight Kurta',
    name_hi: 'अवधी पेस्टल जॉर्जेट हैंड-चिकनकारी स्ट्रेट कुर्ता',
    category: 'kurti',
    price_paise: 99900,
    original_price_paise: 149900,
    image_url: '/products/kurti3.jpg',
    hover_image_url: '/products/kurti3-detail.jpg',
    gallery: ['/products/kurti3.jpg', '/products/kurti3-detail.jpg'],
    stock: 40,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Authentic Lucknowi Tepchi, Bakhiya, and Phanda hand-embroidery on whisper-soft pastel rose georgette, paired with a matching pure cotton inner slip.',
    description_hi:
      'सॉफ्ट पेस्टल जॉर्जेट पर असली लखनवी बखिया और फंदा हैंड-चिकनकारी कढ़ाई, मैचिंग कॉटन इनर स्लिप के साथ।',
    fabric_or_material: 'Pure Viscose Georgette with Cotton Slip',
    care_instructions: 'Gentle hand wash',
    origin_cluster: 'Chowk, Lucknow & Jaipur Guild',
    rating: 4.7,
    reviews_count: 76,
    badge: 'Artisan Pick',
    badge_hi: 'कारीगर विशेष',
    featured: true,
    is_demo: true,
  },
  {
    id: 4,
    sku: 'ZJ-KRT-004',
    name: 'Bagru Natural Indigo Handloom Straight Kurta',
    name_hi: 'बगरू नेचुरल इंडिगो हैंडलूम स्ट्रेट कुर्ता',
    category: 'kurti',
    price_paise: 84900,
    original_price_paise: 124900,
    image_url: '/products/kurti4.jpg',
    hover_image_url: '/products/kurti4-detail.jpg',
    gallery: ['/products/kurti4.jpg', '/products/kurti4-detail.jpg'],
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Traditional Dabu mud-resist block print dyed in deep natural indigo vats in Bagru village. Tailored in a crisp straight silhouette with side slits and pockets.',
    description_hi:
      'बगरू के पारंपरिक दाबू मड-रेज़िस्ट तकनीक और प्राकृतिक नील (इंडिगो) में रंगा आरामदायक हैंडलूम कुर्ता।',
    fabric_or_material: '100% Slub Handloom Cotton',
    care_instructions: 'Wash separately in cold water',
    origin_cluster: 'Bagru Village, Rajasthan',
    rating: 4.6,
    reviews_count: 54,
    featured: false,
    is_demo: true,
  },
  {
    id: 13,
    sku: 'ZJ-KRT-013',
    name: 'Mewar Emerald Silk Bandhani Gota-Patti Kurta Set',
    name_hi: 'मेवाड़ पन्ना सिल्क बंधेज गोटा-पट्टी कुर्ता सेट',
    category: 'kurti',
    price_paise: 149900,
    original_price_paise: 219900,
    image_url: '/products/kurti2-detail.jpg',
    hover_image_url: '/products/kurti2.jpg',
    gallery: ['/products/kurti2-detail.jpg', '/products/kurti2.jpg'],
    stock: 22,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Hand-tied Sikar Bandhani on lustrous Gajji modal silk with Sikar gota-patti border work along the sleeves and hemline.',
    description_hi:
      'चमकदार गज्जी मोडल सिल्क पर सीकर का पारंपरिक हाथ से बंधा बंधेज और गोटा-पट्टी बॉर्डर वर्क।',
    fabric_or_material: 'Gajji Modal Silk with Gota-Patti',
    care_instructions: 'Dry clean only',
    origin_cluster: 'Sikar & Udaipur, Rajasthan',
    rating: 4.9,
    reviews_count: 63,
    badge: 'New Arrival',
    badge_hi: 'नया कलेक्शन',
    featured: true,
    is_demo: true,
  },
  {
    id: 14,
    sku: 'ZJ-KRT-014',
    name: 'Amer Ivory Angrakha Organza Applique Kurta',
    name_hi: 'आमेर आइवरी अंगरखा ऑर्गेंज़ा एप्लिक कुर्ता',
    category: 'kurti',
    price_paise: 114900,
    original_price_paise: 169900,
    image_url: '/products/kurti1-detail.jpg',
    hover_image_url: '/products/kurti1.jpg',
    gallery: ['/products/kurti1-detail.jpg', '/products/kurti1.jpg'],
    stock: 19,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Classic Rajasthani wrap-style Angrakha silhouette in ivory mulmul with handcrafted dori tassels and delicate floral organza applique panels.',
    description_hi:
      'राजस्थानी अंगरखा स्टाइल में आइवरी मलमल कुर्ता, हाथ से बनी डोरी लटकन और ऑर्गेंज़ा फ्लोरल पैनल के साथ।',
    fabric_or_material: 'Ivory Mulmul & Silk Organza',
    care_instructions: 'Gentle hand wash',
    origin_cluster: 'Amer Road Atelier, Jaipur',
    rating: 4.8,
    reviews_count: 41,
    badge: 'Atelier Exclusive',
    badge_hi: 'विशेष डिज़ाइन',
    featured: false,
    is_demo: true,
  },

  // ─── HANDCRAFTED BAGS & POTLIS (5 Flagship Styles) ───
  {
    id: 5,
    sku: 'ZJ-BAG-005',
    name: 'Kutchi Abhla Mirror-Work Embroidered Sling Bag',
    name_hi: 'कच्छी आभला मिरर-वर्क एम्ब्रॉयडर्ड स्लिंग बैग',
    category: 'bag',
    price_paise: 64900,
    original_price_paise: 99900,
    image_url: '/products/bag1.jpg',
    hover_image_url: '/products/bag1-detail.jpg',
    gallery: ['/products/bag1.jpg', '/products/bag1-detail.jpg'],
    stock: 35,
    sizes: ['Compact', 'Regular', 'Large Bridal'],
    description:
      'Handcrafted by Kutch women artisans with real glass abhla mirrors, vibrant silk threadwork, antique brass magnetic closure, and braided tassel strap.',
    description_hi:
      'कच्छ के कारीगरों द्वारा असली कांच के आभला मिरर और रेशमी धागों की कढ़ाई से तैयार आकर्षक स्लिंग बैग।',
    fabric_or_material: 'Handloom Cotton Canvas & Silk Embroidery',
    care_instructions: 'Spot clean with dry cloth',
    origin_cluster: 'Bhuj, Kutch & Jaipur Guild',
    rating: 4.8,
    reviews_count: 89,
    badge: 'Handcrafted',
    badge_hi: 'हस्तनिर्मित',
    featured: true,
    is_demo: true,
  },
  {
    id: 6,
    sku: 'ZJ-BAG-006',
    name: 'Jaipur Block-Print Quilted Cotton Tote Bag',
    name_hi: 'जयपुर ब्लॉक-प्रिंट क्विल्टेड कॉटन टोट बैग',
    category: 'bag',
    price_paise: 54900,
    original_price_paise: 89900,
    image_url: '/products/bag2.jpg',
    hover_image_url: '/products/bag2-detail.jpg',
    gallery: ['/products/bag2.jpg', '/products/bag2-detail.jpg'],
    stock: 20,
    sizes: ['Regular', 'Large Bridal'],
    description:
      'Spacious quilted everyday tote in hand-block printed organic cotton canvas. Fits a 14-inch laptop, features a YKK zip top and interior organizer pockets.',
    description_hi:
      'ऑर्गेनिक कॉटन कैनवास में हैंड-ब्लॉक प्रिंटेड और क्विल्टेड स्पेशियस टोट बैग, ज़िप क्लोज़र और इनर पॉकेट्स के साथ।',
    fabric_or_material: 'Quilted Heavyweight Block-Print Canvas',
    care_instructions: 'Gentle cold wash',
    origin_cluster: 'Sanganer, Jaipur',
    rating: 4.7,
    reviews_count: 63,
    featured: false,
    is_demo: true,
  },
  {
    id: 9,
    sku: 'ZJ-BAG-009',
    name: 'Royal Velvet Zardozi Bridal Potli Clutch',
    name_hi: 'रॉयल वेलवेट ज़रदोज़ी ब्राइडल पोटली क्लच',
    category: 'bag',
    price_paise: 74900,
    original_price_paise: 119900,
    image_url: '/products/bag3.jpg',
    hover_image_url: '/products/bag3-detail.jpg',
    gallery: ['/products/bag3.jpg', '/products/bag3-detail.jpg'],
    stock: 28,
    sizes: ['Compact', 'Regular', 'Large Bridal'],
    description:
      'Plush maroon micro-velvet bridal potli embellished with metallic gold zardozi motifs and a multi-strand woven freshwater pearl handle.',
    description_hi:
      'गहरे मैरून वेलवेट पर सुनहरी ज़रदोज़ी कढ़ाई और मोतियों के हैंडल वाली शाही ब्राइडल पोटली।',
    fabric_or_material: 'Micro-Velvet with Zardozi & Pearl Handle',
    care_instructions: 'Store in dust bag provided',
    origin_cluster: 'Badi Chaupar, Jaipur',
    rating: 4.9,
    reviews_count: 112,
    badge: 'Wedding Favourite',
    badge_hi: 'वेडिंग स्पेशल',
    featured: true,
    is_demo: true,
  },
  {
    id: 10,
    sku: 'ZJ-BAG-010',
    name: 'Heritage Jute & Handloom Ikat Structured Handbag',
    name_hi: 'हेरिटेज जूट और हैंडलूम इकत स्ट्रक्चर्ड हैंडबैग',
    category: 'bag',
    price_paise: 89900,
    original_price_paise: 139900,
    image_url: '/products/bag4.jpg',
    hover_image_url: '/products/bag4-detail.jpg',
    gallery: ['/products/bag4.jpg', '/products/bag4-detail.jpg'],
    stock: 18,
    sizes: ['Regular', 'Large Bridal'],
    description:
      'Eco-luxury structured office and travel handbag crafted from Pochampally handloom Ikat weave, braided natural jute panels, and vegan saddle-tan handles.',
    description_hi:
      'हैंडलूम इकत और प्राकृतिक जूट से बना प्रीमियम स्ट्रक्चर्ड ऑफिस व ट्रैवल हैंडबैग।',
    fabric_or_material: 'Pochampally Ikat & Braided Natural Jute',
    care_instructions: 'Wipe with damp cloth',
    origin_cluster: 'Jaipur & Pochampally Craft Cluster',
    rating: 4.6,
    reviews_count: 41,
    featured: false,
    is_demo: true,
  },
  {
    id: 15,
    sku: 'ZJ-BAG-015',
    name: 'Sheeshmahal Gold Gotapatti Silk Box Clutch',
    name_hi: 'शीशमहल गोल्ड गोटापट्टी सिल्क बॉक्स क्लच',
    category: 'bag',
    price_paise: 94900,
    original_price_paise: 144900,
    image_url: '/products/bag3-detail.jpg',
    hover_image_url: '/products/bag3.jpg',
    gallery: ['/products/bag3-detail.jpg', '/products/bag3.jpg'],
    stock: 16,
    sizes: ['Compact', 'Regular'],
    description:
      'Hard-case evening minaudière box clutch wrapped in raw silk with geometric Sheeshmahal gota-patti marodi work and a detachable antique gold chain.',
    description_hi:
      'रॉ सिल्क और शीशमहल गोटा-पट्टी मरोड़ी वर्क से सजा हार्ड-केस पार्टी बॉक्स क्लच, डिटैचेबल गोल्ड चेन के साथ।',
    fabric_or_material: 'Raw Silk over Brass Frame',
    care_instructions: 'Keep away from moisture',
    origin_cluster: 'MI Road Flagship Atelier, Jaipur',
    rating: 4.9,
    reviews_count: 37,
    badge: 'Festive Luxe',
    badge_hi: 'पार्टी कलेक्शन',
    featured: true,
    is_demo: true,
  },

  // ─── JADAU JEWELLERY & DUPATTAS (5 Flagship Styles) ───
  {
    id: 7,
    sku: 'ZJ-JWL-007',
    name: 'Meenakari Filigree Oxidized Jhumka Earrings',
    name_hi: 'मीनाकारी फिलिग्री ऑक्सीडाइज़्ड झुमका इयररिंग्स',
    category: 'accessory',
    price_paise: 29900,
    original_price_paise: 49900,
    image_url: '/products/acc1.jpg',
    hover_image_url: '/products/acc1-detail.jpg',
    gallery: ['/products/acc1.jpg', '/products/acc1-detail.jpg'],
    stock: 60,
    sizes: ['Single Piece', 'Bridal Pair'],
    description:
      'Feather-light Jaipur dome jhumkas with hand-painted Firozi meenakari enamel work and cascading ghungroo pearl droplets. Hypoallergenic & nickel-free.',
    description_hi:
      'हाथ की मीनाकारी और घुंघरू मोतियों से सजे हल्के वज़न के राजस्थानी झुमके। त्वचा के लिए पूरी तरह सुरक्षित।',
    fabric_or_material: 'Nickel-Free Brass with Meenakari Enamel',
    care_instructions: 'Store in airtight pouch away from perfume',
    origin_cluster: 'Johari Bazar, Jaipur',
    rating: 4.9,
    reviews_count: 215,
    badge: 'Top Rated',
    badge_hi: 'ग्राहक पसंद',
    featured: true,
    is_demo: true,
  },
  {
    id: 8,
    sku: 'ZJ-JWL-008',
    name: 'Banarasi Zari Border Organza Festive Dupatta',
    name_hi: 'बनारसी ज़री बॉर्डर ऑर्गेंज़ा फेस्टिव दुपट्टा',
    category: 'accessory',
    price_paise: 44900,
    original_price_paise: 69900,
    image_url: '/products/acc2.jpg',
    hover_image_url: '/products/acc2-detail.jpg',
    gallery: ['/products/acc2.jpg', '/products/acc2-detail.jpg'],
    stock: 45,
    sizes: ['2.25m', '2.50m'],
    description:
      'Sheer silk-organza drape woven with classic Banarasi kadwa gold zari borders, bootis, and hand-knotted silk tassels.',
    description_hi:
      'पारंपरिक बनारसी कड़वा गोल्ड ज़री बॉर्डर और हाथ से गुंथे टैसल्स के साथ सिल्क-ऑर्गेंज़ा दुपट्टा।',
    fabric_or_material: 'Pure Silk-Organza with Zari Border',
    care_instructions: 'Dry clean only',
    origin_cluster: 'Varanasi & Jaipur Weavers Guild',
    rating: 4.7,
    reviews_count: 68,
    featured: false,
    is_demo: true,
  },
  {
    id: 11,
    sku: 'ZJ-JWL-011',
    name: 'Bikaneri Kundan & Pearl Bridal Choker Set',
    name_hi: 'बीकानेरी कुंदन और पर्ल ब्राइडल चोकर सेट',
    category: 'accessory',
    price_paise: 59900,
    original_price_paise: 99900,
    image_url: '/products/acc3.jpg',
    hover_image_url: '/products/acc3-detail.jpg',
    gallery: ['/products/acc3.jpg', '/products/acc3-detail.jpg'],
    stock: 22,
    sizes: ['Single Piece', 'Bridal Pair'],
    description:
      'Hand-set Bikaneri uncut glass kundan choker necklace with multi-strand pearl pachi work, reverse meenakari backing, and matching chandbali earrings.',
    description_hi:
      'बीकानेरी कुंदन और मोतियों से जड़ा राजपूताना चोकर सेट, मैचिंग चांदबाली इयररिंग्स और एडजस्टेबल डोरी के साथ।',
    fabric_or_material: '22K Gold-Plated Brass, Glass Kundan & Pearls',
    care_instructions: 'Wipe with soft cotton cloth after wear',
    origin_cluster: 'Bikaner & Johari Bazar, Rajasthan',
    rating: 4.9,
    reviews_count: 134,
    badge: 'Royal Edition',
    badge_hi: 'रॉयल कलेक्शन',
    featured: true,
    is_demo: true,
  },
  {
    id: 12,
    sku: 'ZJ-JWL-012',
    name: 'Handblock Ajrakh Modal Silk Heritage Dupatta',
    name_hi: 'हैंडब्लॉक अजरख मोडल सिल्क हेरिटेज दुपट्टा',
    category: 'accessory',
    price_paise: 49900,
    original_price_paise: 79900,
    image_url: '/products/acc4.jpg',
    hover_image_url: '/products/acc4-detail.jpg',
    gallery: ['/products/acc4.jpg', '/products/acc4-detail.jpg'],
    stock: 0,
    sizes: ['2.25m', '2.50m'],
    description:
      '14-stage natural madder red and indigo Ajrakh hand-block printed on buttery-soft modal silk with woven lagdi patta borders.',
    description_hi:
      'प्राकृतिक रंगों से 14 चरणों में तैयार प्रीमियम अजरख हैंड-ब्लॉक मोडल सिल्क दुपट्टा।',
    fabric_or_material: '100% Pure Modal Silk with Lagdi Patta',
    care_instructions: 'Dry clean recommended',
    origin_cluster: 'Ajrakhpur & Barmer, Rajasthan',
    rating: 4.8,
    reviews_count: 47,
    badge: 'Sold Out',
    badge_hi: 'स्टॉक समाप्त',
    featured: false,
    is_demo: true,
  },
  {
    id: 16,
    sku: 'ZJ-JWL-016',
    name: 'Padmavati Jadau Polki & Emerald Maang Tikka Set',
    name_hi: 'पद्मावती जड़ाऊ पोल्की और पन्ना मांग टीका सेट',
    category: 'accessory',
    price_paise: 54900,
    original_price_paise: 89900,
    image_url: '/products/acc3-detail.jpg',
    hover_image_url: '/products/acc3.jpg',
    gallery: ['/products/acc3-detail.jpg', '/products/acc3.jpg'],
    stock: 29,
    sizes: ['Single Piece', 'Bridal Pair'],
    description:
      'Rajasthani Borla-inspired Jadau Polki Maang Tikka and matching Karnphool earrings trimmed with emerald-green agate drops and seed pearls.',
    description_hi:
      'पन्ना-हरे रत्नों और मोतियों से सजा राजस्थानी जड़ाऊ पोल्की मांग टीका और कर्णफूल सेट।',
    fabric_or_material: 'Gold-Plated Brass, Uncut Polki & Emerald Agate',
    care_instructions: 'Store in velvet jewellery box',
    origin_cluster: 'Johari Bazar, Jaipur',
    rating: 4.9,
    reviews_count: 52,
    badge: 'Bridal Edit',
    badge_hi: 'ब्राइडल सेट',
    featured: true,
    is_demo: true,
  },
];

// ─── GENERATOR FOR 200 ADDITIONAL AUTHENTIC JAIPUR ATELIER PIECES (IDs 17..216 -> 216 TOTAL) ───
const KURTI_REGIONS = [
  { en: 'Sanganeri Mulmul', hi: 'सांगानेरी मलमल', cluster: 'Sanganer, Jaipur', fabric: '100% Pure Mulmul Cotton' },
  { en: 'Bagru Dabu Indigo', hi: 'बगरू दाबू इंडिगो', cluster: 'Bagru, Rajasthan', fabric: 'Natural Dyed Handloom Cotton' },
  { en: 'Chanderi Zari Silk', hi: 'चंदेरी ज़री सिल्क', cluster: 'Johari Bazar, Jaipur', fabric: 'Chanderi Silk-Cotton Blend' },
  { en: 'Udaipur Pichwai Print', hi: 'उदयपुर पिछवाई प्रिंट', cluster: 'Udaipur, Mewar', fabric: 'Pure Muslin Silk' },
  { en: 'Jodhpuri Bandhej Gotapatti', hi: 'जोधपुरी बंधेज गोटापट्टी', cluster: 'Jodhpur, Marwar', fabric: 'Gajji Modal Silk' },
  { en: 'Kota Doria Handloom', hi: 'कोटा डोरिया हैंडलूम', cluster: 'Kaithoon, Kota', fabric: 'Pure Kota Doria Khat Weave' },
  { en: 'Bikaneri Marodi Zardozi', hi: 'बीकानेरी मरोड़ी ज़रदोज़ी', cluster: 'Bikaner, Rajasthan', fabric: 'Festive Raw Silk' },
  { en: 'Jaipur Leheriya Festive', hi: 'जयपुर लहरिया फेस्टिव', cluster: 'Bapu Bazar, Jaipur', fabric: 'Pure Georgette with Cotton Lining' },
  { en: 'Amer Heritage Angrakha', hi: 'आमेर हेरिटेज अंगरखा', cluster: 'Amer Road, Jaipur', fabric: 'Hand-Spun Cambric Cotton' },
  { en: 'Shekhawati Floral Block', hi: 'शेखावाटी फ्लोरल ब्लॉक', cluster: 'Nawalgarh, Shekhawati', fabric: 'Organic Slub Cotton' },
];

const KURTI_STYLES = [
  { en: '16-Kali Anarkali Kurta', hi: '16-कली अनारकली कुर्ता', basePrice: 89900 },
  { en: 'Straight Kurta & Palazzo Set', hi: 'स्ट्रेट कुर्ता और पलाज़ो सेट', basePrice: 109900 },
  { en: 'Hand-Embroidered A-Line Kurta', hi: 'हैंड-एम्ब्रॉयडर्ड ए-लाइन कुर्ता', basePrice: 79900 },
  { en: 'Festive Sharara Suit Set', hi: 'फेस्टिव शरारा सूट सेट', basePrice: 139900 },
  { en: 'Peplum Gota-Patti Tunic', hi: 'पेपलम गोटा-पट्टी ट्यूनिक', basePrice: 74900 },
  { en: 'Mandarin Collar Everyday Kurta', hi: 'मैंडरिन कॉलर डेली कुर्ता', basePrice: 69900 },
  { en: 'Flared Kalidar Suit with Dupatta', hi: 'फ्लेयर्ड कलीदार सूट सेट', basePrice: 149900 },
  { en: 'Tassel-Tie Angrakha Kurta', hi: 'टैसल-टाई अंगरखा कुर्ता', basePrice: 94900 },
];

const COLOR_PALETTES = [
  { en: 'Sindoor Crimson', hi: 'सिंदूरी लाल' },
  { en: 'Royal Peacock Emerald', hi: 'मोरपंखी पन्ना' },
  { en: 'Haldi Marigold Gold', hi: 'हल्दी सुनहरा पीला' },
  { en: 'Gulab Dusty Rose', hi: 'गुलाबी रोज़' },
  { en: 'Neel Midnight Indigo', hi: 'गहरा नील इंडिगो' },
  { en: 'Kesar Saffron Coral', hi: 'केसरिया कोरल' },
  { en: 'Chandan Ivory Cream', hi: 'चंदन आइवरी' },
  { en: 'Jamuni RoyalPlum', hi: 'जामुनी बैंगनी' },
  { en: 'Firoza Turquoise Blue', hi: 'फ़िरोज़ी नीला' },
  { en: 'Mehndi Olive Green', hi: 'मेहंदी हरा' },
];

const BAG_CRAFTS = [
  { en: 'Kutchi Abhla Mirror-Work', hi: 'कच्छी आभला मिरर-वर्क', cluster: 'Bhuj & Jaipur Guild', material: 'Hand-Embroidered Cotton & Glass Mirrors' },
  { en: 'Zardozi Velvet Bridal', hi: 'ज़रदोज़ी वेलवेट ब्राइडल', cluster: 'Johari Bazar, Jaipur', material: 'Micro-Velvet & Metallic Dabka Wire' },
  { en: 'Sanganeri Quilted Block-Print', hi: 'सांगानेरी क्विल्टेड ब्लॉक-प्रिंट', cluster: 'Sanganer, Jaipur', material: 'Heavyweight Quilted Organic Canvas' },
  { en: 'Barmer Applique Patchwork', hi: 'बाड़मेर एप्लिक पैचवर्क', cluster: 'Barmer, Rajasthan', material: 'Vintage Brocade & Handloom Cotton' },
  { en: 'Pochampally Ikat & Jute', hi: 'पोचमपल्ली इकत और जूट', cluster: 'Jaipur Handloom Collective', material: 'Handwoven Ikat & Braided Jute' },
  { en: 'Moti-Work Pearl Beaded', hi: 'मोती-वर्क पर्ल बीडेड', cluster: 'Udaipur Artisan Hub', material: 'Raw Silk & Seed Pearls' },
];

const BAG_SILHOUETTES = [
  { en: 'Drawstring Bridal Potli', hi: 'ड्रॉस्ट्रिंग ब्राइडल पोटली', basePrice: 69900, sizes: ['Compact', 'Regular', 'Large Bridal'] },
  { en: 'Crossbody Boho Sling Bag', hi: 'क्रॉसबॉडी बोहो स्लिंग बैग', basePrice: 59900, sizes: ['Compact', 'Regular', 'Large Bridal'] },
  { en: 'Structured Everyday Tote Bag', hi: 'स्ट्रक्चर्ड डेली टोट बैग', basePrice: 64900, sizes: ['Regular', 'Large Bridal'] },
  { en: 'Hard-Case Evening Box Clutch', hi: 'हार्ड-केस पार्टी बॉक्स क्लच', basePrice: 89900, sizes: ['Compact', 'Regular'] },
  { en: 'Travel Duffle & Weekender Bag', hi: 'ट्रैवल डफ़ल और वीकेंडर बैग', basePrice: 119900, sizes: ['Regular', 'Large Bridal'] },
];

const JEWELLERY_CRAFTS = [
  { en: 'Bikaneri Uncut Jadau Polki', hi: 'बीकानेरी अनकट जड़ाऊ पोल्की', cluster: 'Bikaner, Rajasthan', material: '22K Gold-Plated Brass & Polki' },
  { en: 'Jaipur Firozi Meenakari', hi: 'जयपुर फ़िरोज़ी मीनाकारी', cluster: 'Johari Bazar, Jaipur', material: 'Hand-Enamelled Brass & Pearls' },
  { en: 'Thewa Gold-on-Glass Pratapgarh', hi: 'थेवा गोल्ड-ऑन-ग्लास प्रतापगढ़', cluster: 'Pratapgarh, Rajasthan', material: 'Belgian Glass & Gold Leaf Filigree' },
  { en: 'Shekhawati Oxidized Silver-Look', hi: 'शेखावाटी ऑक्सीडाइज़्ड सिल्वर-लुक', cluster: 'Sikar, Rajasthan', material: 'German Silver & Ghungroo Beads' },
  { en: 'Banarasi Kadwa Zari Silk', hi: 'बनारसी कड़वा ज़री सिल्क', cluster: 'Jaipur & Varanasi Guild', material: 'Pure Silk Organza & Zari' },
  { en: 'Ajrakh Natural Dyed Modal', hi: 'अजरख नेचुरल मोडल सिल्क', cluster: 'Barmer & Ajrakhpur', material: '100% Pure Modal Silk' },
];

const JEWELLERY_TYPES = [
  { en: 'Dome Jhumka Earrings', hi: 'डोम झुमका इयररिंग्स', basePrice: 34900, sizes: ['Single Piece', 'Bridal Pair'] },
  { en: 'Royal Choker Necklace Set', hi: 'रॉयल चोकर नेकलेस सेट', basePrice: 69900, sizes: ['Single Piece', 'Bridal Pair'] },
  { en: 'Chandbali & Maang Tikka Set', hi: 'चांदबाली और मांग टीका सेट', basePrice: 49900, sizes: ['Single Piece', 'Bridal Pair'] },
  { en: 'Rajasthani Aad & Rani Haar', hi: 'राजस्थानी आड़ और रानी हार', basePrice: 89900, sizes: ['Single Piece', 'Bridal Pair'] },
  { en: 'Handwoven Heritage Dupatta', hi: 'हैंडवोवन हेरिटेज दुपट्टा', basePrice: 54900, sizes: ['2.25m', '2.50m'] },
];

const KURTI_PHOTOS = [
  ['/products/kurti1.jpg', '/products/kurti1-detail.jpg'],
  ['/products/kurti2.jpg', '/products/kurti2-detail.jpg'],
  ['/products/kurti3.jpg', '/products/kurti3-detail.jpg'],
  ['/products/kurti4.jpg', '/products/kurti4-detail.jpg'],
];

const BAG_PHOTOS = [
  ['/products/bag1.jpg', '/products/bag1-detail.jpg'],
  ['/products/bag2.jpg', '/products/bag2-detail.jpg'],
  ['/products/bag3.jpg', '/products/bag3-detail.jpg'],
  ['/products/bag4.jpg', '/products/bag4-detail.jpg'],
];

const ACC_PHOTOS = [
  ['/products/acc1.jpg', '/products/acc1-detail.jpg'],
  ['/products/acc2.jpg', '/products/acc2-detail.jpg'],
  ['/products/acc3.jpg', '/products/acc3-detail.jpg'],
  ['/products/acc4.jpg', '/products/acc4-detail.jpg'],
];

function generateExtendedCatalog(): Product[] {
  const generated: Product[] = [];
  let nextId = 17;

  // 1) Generate 90 Additional Kurtis (IDs 17..106)
  for (let i = 0; i < 90; i++) {
    const id = nextId++;
    const region = KURTI_REGIONS[i % KURTI_REGIONS.length];
    const style = KURTI_STYLES[Math.floor(i / KURTI_REGIONS.length) % KURTI_STYLES.length];
    const color = COLOR_PALETTES[(i * 3) % COLOR_PALETTES.length];
    const photos = KURTI_PHOTOS[i % KURTI_PHOTOS.length];
    const price = style.basePrice + ((i % 7) * 5000);
    const orig = Math.round(price * 1.38);

    generated.push({
      id,
      sku: `ZJ-KRT-${String(id).padStart(3, '0')}`,
      name: `${color.en} ${region.en} ${style.en}`,
      name_hi: `${color.hi} ${region.hi} ${style.hi}`,
      category: 'kurti',
      price_paise: price,
      original_price_paise: orig,
      image_url: photos[i % 2],
      hover_image_url: photos[(i + 1) % 2],
      gallery: [photos[0], photos[1]],
      stock: 8 + ((i * 7) % 42),
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: `Handcrafted in ${region.cluster} using ${region.fabric}. Tailored in our ${color.en.toLowerCase()} palette with artisanal Jaipur finishing, breathable comfort, and size-graded pattern precision.`,
      description_hi: `${region.cluster} के कारीगरों द्वारा ${region.fabric} में तैयार ${color.hi} ${style.hi}।`,
      fabric_or_material: region.fabric,
      care_instructions: 'Gentle cold hand wash or dry clean',
      origin_cluster: region.cluster,
      rating: Number((4.6 + ((i % 4) * 0.1)).toFixed(1)),
      reviews_count: 14 + ((i * 11) % 120),
      badge: i % 5 === 0 ? 'Artisan Edit' : i % 7 === 0 ? 'Bestseller' : undefined,
      badge_hi: i % 5 === 0 ? 'कारीगर विशेष' : i % 7 === 0 ? 'लोकप्रिय' : undefined,
      featured: i % 6 === 0,
      is_demo: true,
    });
  }

  // 2) Generate 55 Additional Handcrafted Bags & Potlis (IDs 107..161)
  for (let i = 0; i < 55; i++) {
    const id = nextId++;
    const craft = BAG_CRAFTS[i % BAG_CRAFTS.length];
    const silhouette = BAG_SILHOUETTES[Math.floor(i / BAG_CRAFTS.length) % BAG_SILHOUETTES.length];
    const color = COLOR_PALETTES[(i * 2 + 1) % COLOR_PALETTES.length];
    const photos = BAG_PHOTOS[i % BAG_PHOTOS.length];
    const price = silhouette.basePrice + ((i % 6) * 5000);
    const orig = Math.round(price * 1.4);

    generated.push({
      id,
      sku: `ZJ-BAG-${String(id).padStart(3, '0')}`,
      name: `${color.en} ${craft.en} ${silhouette.en}`,
      name_hi: `${color.hi} ${craft.hi} ${silhouette.hi}`,
      category: 'bag',
      price_paise: price,
      original_price_paise: orig,
      image_url: photos[i % 2],
      hover_image_url: photos[(i + 1) % 2],
      gallery: [photos[0], photos[1]],
      stock: 6 + ((i * 5) % 30),
      sizes: silhouette.sizes,
      description: `Hand-stitched in ${craft.cluster} from ${craft.material}. Available in multiple capacities with reinforced brass hardware and lined compartments.`,
      description_hi: `${craft.cluster} में ${craft.material} से हस्तनिर्मित ${color.hi} ${silhouette.hi}।`,
      fabric_or_material: craft.material,
      care_instructions: 'Spot clean only; store in cotton dust bag',
      origin_cluster: craft.cluster,
      rating: Number((4.6 + ((i % 4) * 0.1)).toFixed(1)),
      reviews_count: 11 + ((i * 9) % 95),
      badge: i % 6 === 0 ? 'Handcrafted' : undefined,
      badge_hi: i % 6 === 0 ? 'हस्तनिर्मित' : undefined,
      featured: i % 8 === 0,
      is_demo: true,
    });
  }

  // 3) Generate 55 Additional Jadau Jewellery & Heritage Dupattas (IDs 162..216)
  for (let i = 0; i < 55; i++) {
    const id = nextId++;
    const craft = JEWELLERY_CRAFTS[i % JEWELLERY_CRAFTS.length];
    const jtype = JEWELLERY_TYPES[Math.floor(i / JEWELLERY_CRAFTS.length) % JEWELLERY_TYPES.length];
    const color = COLOR_PALETTES[(i * 5) % COLOR_PALETTES.length];
    const photos = ACC_PHOTOS[i % ACC_PHOTOS.length];
    const price = jtype.basePrice + ((i % 5) * 5000);
    const orig = Math.round(price * 1.42);

    generated.push({
      id,
      sku: `ZJ-JWL-${String(id).padStart(3, '0')}`,
      name: `${color.en} ${craft.en} ${jtype.en}`,
      name_hi: `${color.hi} ${craft.hi} ${jtype.hi}`,
      category: 'accessory',
      price_paise: price,
      original_price_paise: orig,
      image_url: photos[i % 2],
      hover_image_url: photos[(i + 1) % 2],
      gallery: [photos[0], photos[1]],
      stock: 10 + ((i * 3) % 35),
      sizes: jtype.sizes,
      description: `Crafted by master karigars of ${craft.cluster} in ${craft.material}. Finished with skin-safe plating and signature royal Jaipur detailing.`,
      description_hi: `${craft.cluster} के उस्ताद कारीगरों द्वारा ${craft.material} से निर्मित ${color.hi} ${jtype.hi}।`,
      fabric_or_material: craft.material,
      care_instructions: 'Keep away from moisture and sprays',
      origin_cluster: craft.cluster,
      rating: Number((4.7 + ((i % 3) * 0.1)).toFixed(1)),
      reviews_count: 18 + ((i * 7) % 110),
      badge: i % 5 === 0 ? 'Heirloom Craft' : undefined,
      badge_hi: i % 5 === 0 ? 'विरासत शिल्प' : undefined,
      featured: i % 7 === 0,
      is_demo: true,
    });
  }

  return generated;
}

export const DEMO_PRODUCTS: Product[] = [
  ...CORE_FLAGSHIP_PRODUCTS,
  ...generateExtendedCatalog(),
].map(attachSizePriceMaps);

export function getProductById(id: number): Product | undefined {
  return DEMO_PRODUCTS.find((p) => p.id === Number(id));
}

/**
 * Merges a raw database product row with rich boutique metadata and size-based price tables.
 */
export function enrichProduct(
  raw: Partial<Product> & { id: number; name: string; price_paise: number }
): Product {
  const match = DEMO_PRODUCTS.find((d) => d.id === Number(raw.id));
  const normalizedUrl = raw.image_url
    ? raw.image_url.replace(/\.webp$/i, '.svg')
    : match?.image_url || '/products/kurti1.jpg';

  const merged: Product = {
    id: Number(raw.id),
    sku: raw.sku || match?.sku || `ZJ-PRD-${String(raw.id).padStart(3, '0')}`,
    name: raw.name || match?.name || 'Boutique Piece',
    name_hi: raw.name_hi || match?.name_hi || raw.name,
    category: (raw.category as ProductCategory) || match?.category || 'kurti',
    price_paise: Number(raw.price_paise),
    original_price_paise:
      raw.original_price_paise ||
      match?.original_price_paise ||
      Math.round(Number(raw.price_paise) * 1.35),
    image_url: normalizedUrl,
    hover_image_url: raw.hover_image_url || match?.hover_image_url,
    gallery: raw.gallery || match?.gallery || [normalizedUrl],
    stock: typeof raw.stock === 'number' ? raw.stock : (match?.stock ?? 10),
    sizes: raw.sizes || match?.sizes || ['Free Size'],
    description:
      raw.description ||
      match?.description ||
      'Handcrafted Indian ethnic boutique piece crafted by master artisans.',
    description_hi:
      raw.description_hi ||
      match?.description_hi ||
      'पारंपरिक भारतीय कारीगरी से तैयार विशेष बुटीक उत्पाद।',
    fabric_or_material: raw.fabric_or_material || match?.fabric_or_material,
    care_instructions: raw.care_instructions || match?.care_instructions,
    origin_cluster: raw.origin_cluster || match?.origin_cluster,
    rating: raw.rating || match?.rating || 4.8,
    reviews_count: raw.reviews_count || match?.reviews_count || 24,
    badge: raw.badge ?? match?.badge,
    badge_hi: raw.badge_hi ?? match?.badge_hi,
    featured: raw.featured ?? match?.featured ?? false,
    is_demo: raw.is_demo ?? true,
  };

  return attachSizePriceMaps(merged);
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export function filterAndSortProducts(
  products: Product[],
  options: {
    category?: ProductCategory | 'all';
    query?: string;
    sort?: SortOption;
    inStockOnly?: boolean;
    sizeFilter?: string;
  }
): Product[] {
  const {
    category = 'all',
    query = '',
    sort = 'featured',
    inStockOnly = false,
    sizeFilter = '',
  } = options;
  const q = query.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (inStockOnly && p.stock <= 0) return false;
    if (sizeFilter && !p.sizes?.includes(sizeFilter)) return false;
    if (q) {
      const hay =
        `${p.name} ${p.name_hi} ${p.sku || ''} ${p.description} ${p.description_hi} ${p.category} ${p.origin_cluster || ''} ${p.fabric_or_material || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price_paise - b.price_paise);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price_paise - a.price_paise);
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating || b.reviews_count - a.reviews_count);
      break;
    case 'featured':
    default:
      sorted.sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.id - b.id
      );
      break;
  }
  return sorted;
}

export function paginateProducts(
  products: Product[],
  page: number,
  perPage: number = 12
): {
  items: Product[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
} {
  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * perPage;
  const items = products.slice(start, start + perPage);
  return { items, totalItems, totalPages, currentPage };
}
