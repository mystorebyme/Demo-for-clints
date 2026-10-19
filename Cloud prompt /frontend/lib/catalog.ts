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
    image_url: '/products/kurti1.svg',
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
    image_url: '/products/kurti2.svg',
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
    image_url: '/products/kurti3.svg',
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
    image_url: '/products/kurti4.svg',
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
    price_paise: 99900,
    original_price_paise: 149900,
    image_url: '/products/bag1.svg',
    stock: 20,
    sizes: ['Free Size'],
    description:
      'Structured Dabu mud-resist block print and saddle vegan leather tote with antique brass fittings and a 14-inch padded laptop compartment.',
    description_hi:
      'दाबू ब्लॉक प्रिंट और प्रीमियम वीगन लेदर से बना हैंडक्राफ्टेड टोट बैग, एंटीक ब्रास ज़िपर और लैपटॉप स्लीव के साथ।',
    rating: 4.8,
    reviews_count: 94,
    badge: 'Artisan Leather',
    badge_hi: 'हस्तनिर्मित',
    featured: true,
    is_demo: true,
  },
  {
    id: 6,
    name: 'Kutchi Mirror-Work Ethnic Sling Bag',
    name_hi: 'कच्छी मिरर-वर्क एथनिक स्लिंग बैग',
    category: 'bag',
    price_paise: 59900,
    original_price_paise: 94900,
    image_url: '/products/bag2.svg',
    stock: 40,
    sizes: ['Free Size'],
    description:
      'Hand-embroidered Kutchi mirror tapestry crossbody sling bag finished with a braided antique gold chain and magnetic clasp.',
    description_hi:
      'कच्छी मिरर कढ़ाई और एंटीक गोल्ड चेन के साथ तैयार किया गया आकर्षक एथनिक स्लिंग बैग।',
    rating: 4.7,
    reviews_count: 128,
    featured: false,
    is_demo: true,
  },
  {
    id: 7,
    name: 'Heritage Filigree Oxidized Jhumka Earrings',
    name_hi: 'हेरिटेज फिलिग्री ऑक्सीडाइज़्ड झुमका इयररिंग्स',
    category: 'accessory',
    price_paise: 29900,
    original_price_paise: 54900,
    image_url: '/products/acc1.svg',
    stock: 100,
    sizes: ['Free Size'],
    description:
      'Handcrafted German-silver oxidized temple dome jhumkas with lotus studs and cascading ghungroo pearl droplets.',
    description_hi:
      'कमल स्टड और घुंघरू मोतियों की लटकन वाले हैंडक्राफ्टेड जर्मन-सिल्वर ऑक्सीडाइज़्ड झुमका इयररिंग्स।',
    rating: 4.9,
    reviews_count: 264,
    badge: 'Patron Favorite',
    badge_hi: 'सर्वाधिक लोकप्रिय',
    featured: true,
    is_demo: true,
  },
  {
    id: 8,
    name: 'Pochampally Ikat & Jaipuri Jacquard Handbag',
    name_hi: 'पोचमपल्ली इकत और जयपुरी जैकार्ड हैंडबैग',
    category: 'bag',
    price_paise: 119900,
    original_price_paise: 179900,
    image_url: '/products/bag4.svg',
    stock: 12,
    sizes: ['Free Size'],
    description:
      'Handloom geometric jacquard & Pochampally Ikat structured handbag with dual rolled handles and detachable crossbody strap.',
    description_hi:
      'हैंडलूम इकत और जयपुरी जैकार्ड बुनाई वाला मजबूत हैंडबैग, डबल हैंडल और शोल्डर बेल्ट के साथ।',
    rating: 4.8,
    reviews_count: 59,
    featured: false,
    is_demo: true,
  },
  {
    id: 9,
    name: 'Royal Velvet Zardozi Embroidered Potli Bag',
    name_hi: 'रॉयल वेलवेट ज़रदोज़ी कढ़ाईदार पोटली बैग',
    category: 'bag',
    price_paise: 49900,
    original_price_paise: 84900,
    image_url: '/products/bag3.svg',
    stock: 30,
    sizes: ['Free Size'],
    description:
      'Bridal micro-velvet potli bag hand-embellished with metallic dabka zardozi florals and a multi-strand pearl wristlet.',
    description_hi:
      'दबका ज़रदोज़ी कढ़ाई और मोतियों के कंगन हैंडल से सजी शाही मखमली ब्राइडल पोटली बैग।',
    rating: 4.9,
    reviews_count: 87,
    badge: 'Bridal Trousseau',
    badge_hi: 'ब्राइडल स्पेशल',
    featured: false,
    is_demo: true,
  },
  {
    id: 10,
    name: 'Scallop Zari Organza Embroidered Dupatta',
    name_hi: 'स्कैलप ज़री ऑर्गेंज़ा कढ़ाईदार दुपट्टा',
    category: 'accessory',
    price_paise: 44900,
    original_price_paise: 74900,
    image_url: '/products/acc2.svg',
    stock: 60,
    sizes: ['2.25 Meter'],
    description:
      'Sheer silk-organza dupatta (2.25m) featuring scalloped gota-zari borders, woven floral butis, and handcrafted latkan tassels.',
    description_hi:
      'स्कैलप गोटा-ज़री बॉर्डर और हैंडक्राफ्टेड लटकन के साथ 2.25 मीटर लंबा सिल्क-ऑर्गेंज़ा कढ़ाईदार दुपट्टा।',
    rating: 4.8,
    reviews_count: 93,
    featured: false,
    is_demo: true,
  },
  {
    id: 11,
    name: 'Bikaneri Jadau Kundan Pearl Choker Set',
    name_hi: 'बीकानेरी जड़ाऊ कुंदन पर्ल चोकर सेट',
    category: 'accessory',
    price_paise: 64900,
    original_price_paise: 109900,
    image_url: '/products/acc3.svg',
    stock: 18,
    sizes: ['Free Size'],
    description:
      '24K gold-plated Bikaneri Jadau Kundan and freshwater pearl bridal choker necklace with reverse meenakari work and matching studs.',
    description_hi:
      'पीछे की तरफ मीनाकारी और मोतियों की पिरोई वाला बीकानेरी जड़ाऊ कुंदन पर्ल चोकर सेट, मैचिंग टॉप्स के साथ।',
    rating: 4.9,
    reviews_count: 71,
    badge: 'Heritage Jewellery',
    badge_hi: 'शाही ज्वेलरी',
    featured: false,
    is_demo: true,
  },
  {
    id: 12,
    name: 'Jaipur Meenakari & Rajasthani Mirror Bangles',
    name_hi: 'जयपुर मीनाकारी और राजस्थानी मिरर चूड़ियाँ',
    category: 'accessory',
    price_paise: 34900,
    original_price_paise: 59900,
    image_url: '/products/acc4.svg',
    stock: 0,
    sizes: ['2.4', '2.6', '2.8'],
    description:
      'Artisanal set of 6 hand-painted Jaipur meenakari and mirror-work kadas crafted by master lac artisans.',
    description_hi:
      'जयपुर के उस्ताद कारीगरों द्वारा तैयार 6 मीनाकारी और राजस्थानी मिरर चूड़ियों का सेट।',
    rating: 4.7,
    reviews_count: 48,
    featured: false,
    is_demo: true,
  },
];

export function enrichProduct(raw: Partial<Product> & { id: number; name: string }): Product {
  const match = DEMO_PRODUCTS.find((p) => p.id === Number(raw.id));
  const rawImg = raw.image_url || match?.image_url || '/products/kurti1.svg';
  const normalizedImg = rawImg.startsWith('data:')
    ? rawImg
    : rawImg.replace(/\.webp$/i, '.svg');

  return {
    id: Number(raw.id),
    name: raw.name || match?.name || 'Ethnic Product',
    name_hi: raw.name_hi || match?.name_hi || raw.name || 'एथनिक उत्पाद',
    category: (raw.category as ProductCategory) || match?.category || 'kurti',
    price_paise: Number(raw.price_paise ?? match?.price_paise ?? 49900),
    original_price_paise: raw.original_price_paise ?? match?.original_price_paise,
    image_url: normalizedImg,
    stock: Number(raw.stock ?? match?.stock ?? 10),
    sizes: raw.sizes ?? match?.sizes ?? ['Free Size'],
    description: raw.description ?? match?.description ?? 'Authentic handcrafted ethnic wear item.',
    description_hi: raw.description_hi ?? match?.description_hi ?? 'प्रामाणिक हस्तनिर्मित एथनिक उत्पाद।',
    rating: Number(raw.rating ?? match?.rating ?? 4.8),
    reviews_count: Number(raw.reviews_count ?? match?.reviews_count ?? 25),
    badge: raw.badge ?? match?.badge,
    badge_hi: raw.badge_hi ?? match?.badge_hi,
    is_demo: true,
  };
}

export function getProductById(id: number): Product | undefined {
  return DEMO_PRODUCTS.find((p) => p.id === Number(id));
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
  const q = query.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (inStockOnly && p.stock <= 0) return false;
    if (q) {
      const hay = `${p.name} ${p.name_hi} ${p.description} ${p.description_hi} ${p.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  if (sort === 'price-asc') {
    sorted.sort((a, b) => a.price_paise - b.price_paise);
  } else if (sort === 'price-desc') {
    sorted.sort((a, b) => b.price_paise - a.price_paise);
  } else if (sort === 'rating') {
    sorted.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    sorted.sort((a, b) => b.id - a.id);
  } else if (sort === 'name-asc') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

export function paginateProducts<T>(
  items: T[],
  page: number,
  perPage: number = 8
): {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
} {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    currentPage,
    totalPages,
    totalItems,
  };
}
