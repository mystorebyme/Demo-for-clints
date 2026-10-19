export type ProductCategory = 'kurti' | 'bag' | 'accessory';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'name-asc';

export type Product = {
  id: number;
  name: string;
  name_hi: string;
  category: ProductCategory;
  price_paise: number;
  original_price_paise?: number;
  image_url: string;
  hover_image_url?: string;
  gallery?: string[];
  stock: number;
  sizes: string[];
  description: string;
  description_hi: string;
  rating: number;
  reviews_count: number;
  badge?: string;
  badge_hi?: string;
  featured?: boolean;
  is_demo: boolean;
  created_at?: string;
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Sanganeri Mulmul Cotton Straight Kurti',
    name_hi: 'सांगानेरी मलमल कॉटन स्ट्रेट कुर्ती',
    category: 'kurti',
    price_paise: 79900,
    original_price_paise: 129900,
    image_url: '/products/kurti1.jpg',
    hover_image_url: '/products/kurti1-detail.jpg',
    gallery: ['/products/kurti1.jpg', '/products/kurti1-detail.jpg', '/products/kurti1.svg'],
    stock: 50,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Hand-block printed Sanganeri 60x60 cambric cotton straight kurti accented with artisanal gota-patti neckline detailing and mother-of-pearl buttons.',
    description_hi:
      'असली सांगानेरी हैंड-ब्लॉक प्रिंट और बारीक गोटा-पट्टी नेकलाइन वर्क वाली 100% शुद्ध कैम्ब्रिक कॉटन स्ट्रेट कुर्ती।',
    rating: 4.9,
    reviews_count: 184,
    badge: 'Signature Bestseller',
    badge_hi: 'सिग्नेचर बेस्टसेलर',
    featured: true,
    is_demo: true,
  },
  {
    id: 2,
    name: 'Maharani Zardozi Festive Anarkali Kurti',
    name_hi: 'महारानी ज़रदोज़ी फेस्टिव अनारकली कुर्ती',
    category: 'kurti',
    price_paise: 129900,
    original_price_paise: 199900,
    image_url: '/products/kurti2.jpg',
    hover_image_url: '/products/kurti2-detail.jpg',
    gallery: ['/products/kurti2.jpg', '/products/kurti2-detail.jpg', '/products/kurti2.svg'],
    stock: 35,
    sizes: ['M', 'L', 'XL'],
    description:
      '16-panel flared royal Chanderi silk-blend Anarkali kurti featuring antique golden zari yoke embroidery and woven brocade borders.',
    description_hi:
      '16-कली घेरदार रॉयल चंदेरी सिल्क अनारकली कुर्ती, एंटीक गोल्डन ज़री कढ़ाई और ब्रोकेड बॉर्डर के साथ।',
    rating: 4.9,
    reviews_count: 146,
    badge: 'Royal Couture',
    badge_hi: 'रॉयल कलेक्शन',
    featured: true,
    is_demo: true,
  },
  {
    id: 3,
    name: 'Awadhi Pastel Chikankari Kurti',
    name_hi: 'अवधी पेस्टल चिकनकारी कुर्ती',
    category: 'kurti',
    price_paise: 99900,
    original_price_paise: 159900,
    image_url: '/products/kurti3.jpg',
    hover_image_url: '/products/kurti3-detail.jpg',
    gallery: ['/products/kurti3.jpg', '/products/kurti3-detail.jpg', '/products/kurti3.svg'],
    stock: 25,
    sizes: ['S', 'M', 'L'],
    description:
      'Authentic Lucknowi hand-embroidered resham Chikankari kurta on feather-soft pastel modal mulmul with bakhiya and phanda stitches.',
    description_hi:
      'असली लखनवी रेशम हैंड-एम्ब्रॉयडरी पेस्टल चिकनकारी कुर्ती, बखिया और फंदा टांकों की नज़ाकत के साथ।',
    rating: 4.8,
    reviews_count: 112,
    badge: 'Hand-Embroidered',
    badge_hi: 'हस्त-कढ़ाई',
    featured: true,
    is_demo: true,
  },
  {
    id: 4,
    name: 'Banarasi Katan Royal Silk Blend Kurti',
    name_hi: 'बनारसी कतान रॉयल सिल्क ब्लेंड कुर्ती',
    category: 'kurti',
    price_paise: 159900,
    original_price_paise: 249900,
    image_url: '/products/kurti4.jpg',
    hover_image_url: '/products/kurti4-detail.jpg',
    gallery: ['/products/kurti4.jpg', '/products/kurti4-detail.jpg', '/products/kurti4.svg'],
    stock: 4,
    sizes: ['M', 'L', 'XL', 'XXL'],
    description:
      'Heirloom-grade Varanasi Katan silk-blend straight kurta woven with kadwa gold zari floral motifs and pure silk lining.',
    description_hi:
      'कड़वा गोल्डन ज़री बूटी और शुद्ध सिल्क लाइनिंग के साथ बुनी गई शाही बनारसी कतान रॉयल सिल्क ब्लेंड कुर्ती।',
    rating: 5.0,
    reviews_count: 78,
    badge: 'Limited Edition',
    badge_hi: 'सीमित संस्करण',
    featured: true,
    is_demo: true,
  },
  {
    id: 5,
    name: 'Dabu Artisan Handcrafted Tote Bag',
    name_hi: 'दाबू आर्टिसन हैंडक्राफ्टेड टोट बैग',
    category: 'bag',
    price_paise: 59900,
    original_price_paise: 99900,
    image_url: '/products/bag1.jpg',
    hover_image_url: '/products/bag1-detail.jpg',
    gallery: ['/products/bag1.jpg', '/products/bag1-detail.jpg', '/products/bag1.svg'],
    stock: 20,
    sizes: ['Free Size'],
    description:
      'Spacious Kutchi mirror-work and indigo Dabu mud-resist printed artisan tote bag with reinforced vegan leather straps and brass zip.',
    description_hi:
      'कच्छी मिरर-वर्क और इंडिगो दाबू प्रिंट वाला मज़बूत हैंडक्राफ्टेड टोट बैग, प्रीमियम ज़िप और पॉकेट्स के साथ।',
    rating: 4.8,
    reviews_count: 94,
    badge: 'Artisan Guild',
    badge_hi: 'दस्तकारी विशेष',
    featured: true,
    is_demo: true,
  },
  {
    id: 6,
    name: 'Kalamkari Heritage Crossbody Sling Bag',
    name_hi: 'कलमकारी हेरिटेज क्रॉसबॉडी स्लिंग बैग',
    category: 'bag',
    price_paise: 69900,
    original_price_paise: 119900,
    image_url: '/products/bag2.jpg',
    hover_image_url: '/products/bag2-detail.jpg',
    gallery: ['/products/bag2.jpg', '/products/bag2-detail.jpg', '/products/bag2.svg'],
    stock: 30,
    sizes: ['Free Size'],
    description:
      'Handcrafted peacock-motif embroidery crossbody sling bag featuring antique brass hardware and dual-compartment suede interior.',
    description_hi:
      'मोर कढ़ाई और एंटीक ब्रास हार्डवेयर वाला हैंडक्राफ्टेड क्रॉसबॉडी स्लिंग बैग, डबल कम्पार्टमेंट के साथ।',
    rating: 4.7,
    reviews_count: 83,
    badge: 'Trending Edit',
    badge_hi: 'ट्रेंडिंग',
    featured: false,
    is_demo: true,
  },
  {
    id: 7,
    name: 'Bikaneri Meenakari Peacock Jhumka Earrings',
    name_hi: 'बीकानेरी मीनाकारी मयूर झुमका इयररिंग्स',
    category: 'accessory',
    price_paise: 29900,
    original_price_paise: 59900,
    image_url: '/products/acc1.jpg',
    hover_image_url: '/products/acc1-detail.jpg',
    gallery: ['/products/acc1.jpg', '/products/acc1-detail.jpg', '/products/acc1.svg'],
    stock: 60,
    sizes: ['Free Size'],
    description:
      '22K gold-toned Bikaneri Meenakari dome jhumkas hand-set with uncut Kundan stones and freshwater pearl ghungroo drops.',
    description_hi:
      'कुंदन और मोती घुंघरू पिरोए हुए 22K गोल्ड-प्लेटेड बीकानेरी मीनाकारी मयूर झुमके।',
    rating: 4.9,
    reviews_count: 215,
    badge: 'Patron Favourite',
    badge_hi: 'ग्राहक पसंद',
    featured: true,
    is_demo: true,
  },
  {
    id: 8,
    name: 'Ajrakh Modal Silk Zari Dupatta',
    name_hi: 'अजरख मोडल सिल्क ज़री दुपट्टा',
    category: 'accessory',
    price_paise: 54900,
    original_price_paise: 89900,
    image_url: '/products/acc2.jpg',
    hover_image_url: '/products/acc2-detail.jpg',
    gallery: ['/products/acc2.jpg', '/products/acc2-detail.jpg', '/products/acc2.svg'],
    stock: 40,
    sizes: ['2.5 Meters'],
    description:
      'Full-length 2.5m hand-dyed natural indigo Ajrakh modal silk dupatta finished with woven golden tissue pallu borders and hand-knotted tassels.',
    description_hi:
      'सुनहरे ज़री बॉर्डर और हैंड-टैसल्स के साथ 2.5 मीटर लंबा शुद्ध मोडल सिल्क अजरख दुपट्टा।',
    rating: 4.8,
    reviews_count: 129,
    badge: 'Pure Modal Silk',
    badge_hi: 'शुद्ध मोडल सिल्क',
    featured: false,
    is_demo: true,
  },
  {
    id: 9,
    name: 'Zardozi Velvet Bridal Potli Clutch',
    name_hi: 'ज़रदोज़ी वेलवेट ब्राइडल पोटली क्लच',
    category: 'bag',
    price_paise: 89900,
    original_price_paise: 149900,
    image_url: '/products/bag3.jpg',
    hover_image_url: '/products/bag3-detail.jpg',
    gallery: ['/products/bag3.jpg', '/products/bag3-detail.jpg', '/products/bag3.svg'],
    stock: 15,
    sizes: ['Free Size'],
    description:
      'Royal crimson micro-velvet bridal potli embroidered with metallic dabka zardozi florals and braided multi-strand pearl handle.',
    description_hi:
      'शादियों और उत्सवों के लिए शाही दबका ज़रदोज़ी वर्क और मोती हैंडल वाली वेलवेट ब्राइडल पोटली।',
    rating: 4.9,
    reviews_count: 108,
    badge: 'Bridal Trousseau',
    badge_hi: 'ब्राइडल कलेक्शन',
    featured: true,
    is_demo: true,
  },
  {
    id: 10,
    name: 'Jaipuri Block-Print Quilted Shoulder Bag',
    name_hi: 'जयपुरी ब्लॉक-प्रिंट क्विल्टेड शोल्डर बैग',
    category: 'bag',
    price_paise: 64900,
    original_price_paise: 109900,
    image_url: '/products/bag4.jpg',
    hover_image_url: '/products/bag4-detail.jpg',
    gallery: ['/products/bag4.jpg', '/products/bag4-detail.jpg', '/products/bag4.svg'],
    stock: 22,
    sizes: ['Free Size'],
    description:
      'Hand-quilted organic cotton shoulder bag with Bagru botanical block prints, padded laptop sleeve, and tassel zipper pull.',
    description_hi:
      'बगरू हैंड-ब्लॉक प्रिंट और पैडेड कम्पार्टमेंट वाला हल्का और स्टाइलिश क्विल्टेड शोल्डर बैग।',
    rating: 4.7,
    reviews_count: 67,
    badge: 'Everyday Luxury',
    badge_hi: 'डेली लक्ज़री',
    featured: false,
    is_demo: true,
  },
  {
    id: 11,
    name: 'Rajputana Jadau Polki Bridal Choker Set',
    name_hi: 'राजपूताना जड़ाऊ पोल्की ब्राइडल चोकर सेट',
    category: 'accessory',
    price_paise: 149900,
    original_price_paise: 249900,
    image_url: '/products/acc3.jpg',
    hover_image_url: '/products/acc3-detail.jpg',
    gallery: ['/products/acc3.jpg', '/products/acc3-detail.jpg', '/products/acc3.svg'],
    stock: 18,
    sizes: ['Adjustable'],
    description:
      'Heirloom Rajputana Jadau Polki choker necklace with matching chandbali earrings, emerald bead drops, and adjustable silk dori.',
    description_hi:
      'मैचिंग चांदबाली इयररिंग्स और पन्ना मोती ड्रॉप्स के साथ शाही राजपूताना जड़ाऊ पोल्की चोकर नेकलेस सेट।',
    rating: 5.0,
    reviews_count: 162,
    badge: 'Heirloom Polki',
    badge_hi: 'शाही जड़ाऊ सेट',
    featured: true,
    is_demo: true,
  },
  {
    id: 12,
    name: 'Tribal Silver Ghungroo Payal Anklet Pair',
    name_hi: 'ट्राइबल सिल्वर घुंघरू पायल जोड़ी',
    category: 'accessory',
    price_paise: 44900,
    original_price_paise: 79900,
    image_url: '/products/acc4.jpg',
    hover_image_url: '/products/acc4-detail.jpg',
    gallery: ['/products/acc4.jpg', '/products/acc4-detail.jpg', '/products/acc4.svg'],
    stock: 0,
    sizes: ['Free Size'],
    description:
      'Handcrafted oxidised German silver tribal payal pair adorned with melodious ghungroo bells and secure S-hook clasp.',
    description_hi:
      'मधुर घुंघरू और पारंपरिक राजस्थानी नक्काशी वाली ऑक्सीडाइज़्ड सिल्वर पायल जोड़ी।',
    rating: 4.8,
    reviews_count: 91,
    badge: 'Archive Piece',
    badge_hi: 'आर्काइव पीस',
    featured: false,
    is_demo: true,
  },
  {
    id: 13,
    name: 'Bagru Indigo Hand-Block Angrakha Kurta Set',
    name_hi: 'बगरू इंडिगो हैंड-ब्लॉक अंगरखा कुर्ता सेट',
    category: 'kurti',
    price_paise: 139900,
    original_price_paise: 219900,
    image_url: '/products/kurti1-detail.jpg',
    hover_image_url: '/products/kurti1.jpg',
    gallery: ['/products/kurti1-detail.jpg', '/products/kurti1.jpg'],
    stock: 28,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Traditional Rajasthani tie-knot Angrakha kurta crafted in natural indigo Bagru block-printed mulmul with handcrafted cowrie shell tassels.',
    description_hi:
      'प्राकृतिक इंडिगो बगरू ब्लॉक-प्रिंट और हैंडमेड टैसल्स के साथ पारंपरिक राजस्थानी अंगरखा कुर्ता सेट।',
    rating: 4.9,
    reviews_count: 89,
    badge: 'Jaipur Atelier',
    badge_hi: 'जयपुर विशेष',
    featured: true,
    is_demo: true,
  },
  {
    id: 14,
    name: 'Mewar Gotapatti Tissue Chanderi Suit Set',
    name_hi: 'मेवाड़ गोटापट्टी टिश्यू चंदेरी सूट सेट',
    category: 'kurti',
    price_paise: 189900,
    original_price_paise: 289900,
    image_url: '/products/kurti2-detail.jpg',
    hover_image_url: '/products/kurti2.jpg',
    gallery: ['/products/kurti2-detail.jpg', '/products/kurti2.jpg'],
    stock: 19,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Festive three-piece Chanderi silk kurta set embellished with hand-appliqued Mewari gota-patti border work and zari organza dupatta.',
    description_hi:
      'हैंड-एप्लिक मेवाड़ी गोटा-पट्टी वर्क और ज़री ऑर्गेंज़ा दुपट्टे के साथ शाही चंदेरी सिल्क सूट सेट।',
    rating: 5.0,
    reviews_count: 118,
    badge: 'Festive Couture',
    badge_hi: 'उत्सव विशेष',
    featured: true,
    is_demo: true,
  },
  {
    id: 15,
    name: 'Shekhawati Mirror-Work Festive Banjara Clutch',
    name_hi: 'शेखावाटी मिरर-वर्क फेस्टिव बंजारा क्लच',
    category: 'bag',
    price_paise: 74900,
    original_price_paise: 129900,
    image_url: '/products/bag1-detail.jpg',
    hover_image_url: '/products/bag1.jpg',
    gallery: ['/products/bag1-detail.jpg', '/products/bag1.jpg'],
    stock: 16,
    sizes: ['Free Size'],
    description:
      'Hand-stitched Shekhawati abhla mirror-work clutch bag with antique brass sling chain and raw silk lining.',
    description_hi:
      'एंटीक ब्रास चेन और रॉ सिल्क लाइनिंग के साथ शेखावाटी आभला मिरर-वर्क क्लच बैग।',
    rating: 4.8,
    reviews_count: 64,
    badge: 'Handcrafted',
    badge_hi: 'हस्तनिर्मित',
    featured: false,
    is_demo: true,
  },
  {
    id: 16,
    name: 'Udaipur Navratna Kundan Chandbali & Tikka Set',
    name_hi: 'उदयपुर नवरत्न कुंदन चांदबाली और मांगटीका सेट',
    category: 'accessory',
    price_paise: 119900,
    original_price_paise: 189900,
    image_url: '/products/acc3-detail.jpg',
    hover_image_url: '/products/acc3.jpg',
    gallery: ['/products/acc3-detail.jpg', '/products/acc3.jpg'],
    stock: 14,
    sizes: ['Free Size'],
    description:
      'Handcrafted Udaipur Navratna Kundan chandbali earrings paired with a matching bridal maang-tikka in 22K gold micron plating.',
    description_hi:
      '22K गोल्ड माइक्रोन प्लेटिंग में उदयपुर नवरत्न कुंदन चांदबाली इयररिंग्स और मैचिंग मांगटीका सेट।',
    rating: 4.9,
    reviews_count: 104,
    badge: 'Bridal Heritage',
    badge_hi: 'ब्राइडल हेरिटेज',
    featured: true,
    is_demo: true,
  },
];

const FALLBACK_DETAILS: Record<
  ProductCategory,
  {
    sizes: string[];
    description: string;
    description_hi: string;
    badge: string;
    badge_hi: string;
  }
> = {
  kurti: {
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Handcrafted Jaipur ethnic wear tailored with breathable handloom fabric.',
    description_hi: 'जयपुर के कुशल कारीगरों द्वारा तैयार प्रीमियम एथनिक कुर्ती।',
    badge: 'Ethnic Wear',
    badge_hi: 'एथनिक वियर',
  },
  bag: {
    sizes: ['Free Size'],
    description: 'Artisan handcrafted bag with durable stitching and spacious compartments.',
    description_hi: 'मज़बूत सिलाई और आकर्षक डिज़ाइन वाला हैंडक्राफ्टेड बैग।',
    badge: 'Handcrafted',
    badge_hi: 'हस्तनिर्मित',
  },
  accessory: {
    sizes: ['Free Size'],
    description: 'Traditional Indian fashion accessory to elevate your festive look.',
    description_hi: 'आपके फेस्टिव लुक को और खास बनाने के लिए पारंपरिक एक्सेसरी।',
    badge: 'Festive Pick',
    badge_hi: 'फेस्टिव पिक',
  },
};

export function normalizeAssetUrl(url?: string, category: ProductCategory = 'kurti'): string {
  if (!url) {
    return category === 'kurti'
      ? '/products/kurti1.jpg'
      : category === 'bag'
      ? '/products/bag1.jpg'
      : '/products/acc1.jpg';
  }
  return url.replace(/\.webp$/i, '.svg');
}

export function enrichProduct(raw: Partial<Product> & { id: number; name: string }): Product {
  const seedMatch = DEMO_PRODUCTS.find((p) => p.id === Number(raw.id));
  const category: ProductCategory =
    raw.category === 'bag' || raw.category === 'accessory' || raw.category === 'kurti'
      ? raw.category
      : seedMatch?.category || 'kurti';
  const fallback = FALLBACK_DETAILS[category];

  const pricePaise = Number(raw.price_paise ?? seedMatch?.price_paise ?? 79900);
  const imageUrl = raw.image_url
    ? normalizeAssetUrl(raw.image_url, category)
    : seedMatch?.image_url || normalizeAssetUrl(undefined, category);

  return {
    id: Number(raw.id),
    name: raw.name || seedMatch?.name || 'Fashion Item',
    name_hi: raw.name_hi || seedMatch?.name_hi || raw.name || 'फ़ैशन आइटम',
    category,
    price_paise: pricePaise,
    original_price_paise:
      raw.original_price_paise ?? seedMatch?.original_price_paise ?? Math.round(pricePaise * 1.4),
    image_url: imageUrl,
    hover_image_url: raw.hover_image_url ?? seedMatch?.hover_image_url,
    gallery: raw.gallery ?? seedMatch?.gallery ?? [imageUrl],
    stock: typeof raw.stock === 'number' ? raw.stock : seedMatch?.stock ?? 10,
    sizes: raw.sizes || seedMatch?.sizes || fallback.sizes,
    description: raw.description || seedMatch?.description || fallback.description,
    description_hi: raw.description_hi || seedMatch?.description_hi || fallback.description_hi,
    rating: raw.rating ?? seedMatch?.rating ?? 4.7,
    reviews_count: raw.reviews_count ?? seedMatch?.reviews_count ?? 42,
    badge: raw.badge ?? seedMatch?.badge ?? fallback.badge,
    badge_hi: raw.badge_hi ?? seedMatch?.badge_hi ?? fallback.badge_hi,
    featured: raw.featured ?? seedMatch?.featured ?? false,
    is_demo: true,
    created_at: raw.created_at,
  };
}

export function filterAndSortProducts(
  products: Product[],
  options: {
    category?: ProductCategory | 'all';
    query?: string;
    sort?: SortOption;
    inStockOnly?: boolean;
  }
): Product[] {
  const { category = 'all', query = '', sort = 'featured', inStockOnly = false } = options;
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (inStockOnly && p.stock <= 0) return false;
    if (normalizedQuery) {
      const hay = `${p.name} ${p.name_hi} ${p.description} ${p.description_hi} ${p.category}`.toLowerCase();
      if (!hay.includes(normalizedQuery)) return false;
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
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
      sorted.sort((a, b) => b.id - a.id);
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.id - b.id);
      break;
  }
  return sorted;
}

export function getProductById(id: number): Product | undefined {
  return DEMO_PRODUCTS.find((p) => p.id === Number(id));
}

export function paginateProducts(
  products: Product[],
  page: number,
  perPage: number = 8
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
