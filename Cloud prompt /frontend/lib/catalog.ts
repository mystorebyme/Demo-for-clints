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
    price_paise: 99900,
    original_price_paise: 149900,
    image_url: '/products/bag1.jpg',
    hover_image_url: '/products/bag1-detail.jpg',
    gallery: ['/products/bag1.jpg', '/products/bag1-detail.jpg', '/products/bag1.svg'],
    stock: 20,
    sizes: ['Free Size'],
    description:
      'Spacious Jaipur Dabu indigo mud-resist handloom canvas tote with genuine vegetable-tanned saddle handles and brass hardware.',
    description_hi:
      'असली जयपुर दाबू इंडिगो हैंडलूम कैनवास और प्रीमियम लेदर हैंडल से बना विशाल टोट बैग।',
    rating: 4.8,
    reviews_count: 94,
    badge: 'Artisan Pick',
    badge_hi: 'कारीगर विशेष',
    featured: true,
    is_demo: true,
  },
  {
    id: 6,
    name: 'Kutchi Mirror-Work Embroidered Sling Bag',
    name_hi: 'कच्छी मिरर-वर्क एम्ब्रॉयडरी स्लिंग बैग',
    category: 'bag',
    price_paise: 64900,
    original_price_paise: 99900,
    image_url: '/products/bag2.jpg',
    hover_image_url: '/products/bag2-detail.jpg',
    gallery: ['/products/bag2.jpg', '/products/bag2-detail.jpg', '/products/bag2.svg'],
    stock: 30,
    sizes: ['Free Size'],
    description:
      'Hand-stitched Kutchi abhla mirror-work crossbody sling bag with braided artisan tassel strap and magnetic flap closure.',
    description_hi:
      'पारंपरिक कच्छी आभला मिरर-वर्क और हैंडमेड टैसल स्ट्रैप वाला स्टाइलिश स्लिंग बैग।',
    rating: 4.8,
    reviews_count: 89,
    featured: false,
    is_demo: true,
  },
  {
    id: 7,
    name: 'Zardozi Velvet Bridal Potli Clutch',
    name_hi: 'ज़रदोज़ी वेलवेट ब्राइडल पोटली क्लच',
    category: 'bag',
    price_paise: 29900,
    original_price_paise: 54900,
    image_url: '/products/bag3.jpg',
    hover_image_url: '/products/bag3-detail.jpg',
    gallery: ['/products/bag3.jpg', '/products/bag3-detail.jpg', '/products/bag3.svg'],
    stock: 40,
    sizes: ['Free Size'],
    description:
      'Royal maroon micro-velvet bridal potli embellished with golden dabka zardozi and multi-strand freshwater pearl drawstrings.',
    description_hi:
      'गोल्डन दबका ज़रदोज़ी और मोतियों की डोरी से सजी शाही मैरून वेलवेट ब्राइडल पोटली।',
    rating: 4.9,
    reviews_count: 132,
    badge: 'Bridal Favourite',
    badge_hi: 'ब्राइडल पसंद',
    featured: true,
    is_demo: true,
  },
  {
    id: 8,
    name: 'Jaipuri Block-Print Quilted Artisan Wallet',
    name_hi: 'जयपुरी ब्लॉक-प्रिंट क्विल्टेड क्लच वॉलेट',
    category: 'bag',
    price_paise: 49900,
    original_price_paise: 79900,
    image_url: '/products/bag4.jpg',
    hover_image_url: '/products/bag4-detail.jpg',
    gallery: ['/products/bag4.jpg', '/products/bag4-detail.jpg', '/products/bag4.svg'],
    stock: 60,
    sizes: ['Free Size'],
    description:
      'Bagru natural-dyed quilted cotton organizer clutch and travel wallet with dual zippered compartments and card slots.',
    description_hi:
      'बगरू नेचुरल-डाई क्विल्टेड कॉटन ट्रैवल क्लच और वॉलेट, ज़िपर पॉकेट के साथ।',
    rating: 4.7,
    reviews_count: 68,
    featured: false,
    is_demo: true,
  },
  {
    id: 9,
    name: 'Royal Gajraj Meenakari Gold Jhumka Earrings',
    name_hi: 'रॉयल गजराज मीनाकारी गोल्ड झुमका सेट',
    category: 'accessory',
    price_paise: 19900,
    original_price_paise: 39900,
    image_url: '/products/acc1.jpg',
    hover_image_url: '/products/acc1-detail.jpg',
    gallery: ['/products/acc1.jpg', '/products/acc1-detail.jpg', '/products/acc1.svg'],
    stock: 100,
    sizes: ['Free Size'],
    description:
      'Hand-crafted Jaipur Bikaneri Meenakari and ruby-emerald kundan jhumka earrings with intricate Gajraj elephant carvings and pearl drops.',
    description_hi:
      'बारीक बीकानेरी मीनाकारी, गजराज कार्विंग और मोती की लटकन वाले शाही झुमके।',
    rating: 4.9,
    reviews_count: 245,
    badge: 'Top Rated',
    badge_hi: 'टॉप रेटेड',
    featured: true,
    is_demo: true,
  },
  {
    id: 10,
    name: 'Crimson Ajrakh Hand-Block Heritage Silk Dupatta',
    name_hi: 'क्रिमसन अजरख हैंड-ब्लॉक हेरिटेज सिल्क दुपट्टा',
    category: 'accessory',
    price_paise: 54900,
    original_price_paise: 89900,
    image_url: '/products/acc2.jpg',
    hover_image_url: '/products/acc2-detail.jpg',
    gallery: ['/products/acc2.jpg', '/products/acc2-detail.jpg', '/products/acc2.svg'],
    stock: 45,
    sizes: ['2.5 Meter'],
    description:
      'Full 2.5-meter heirloom crimson Ajrakh & Sanganeri hand-block printed modal silk drape with traditional geometric temple borders.',
    description_hi:
      'पारंपरिक ज्योमेट्रिक बॉर्डर और अजरख हैंड-ब्लॉक प्रिंट वाला 2.5 मीटर लंबा शाही सिल्क दुपट्टा।',
    rating: 4.9,
    reviews_count: 118,
    featured: true,
    is_demo: true,
  },
  {
    id: 11,
    name: 'Bikaneri Jadau Polki & Navratna Bridal Choker Set',
    name_hi: 'बीकानेरी जड़ाऊ पोल्की और नवरत्न ब्राइडल चोकर सेट',
    category: 'accessory',
    price_paise: 89900,
    original_price_paise: 149900,
    image_url: '/products/acc3.jpg',
    hover_image_url: '/products/acc3-detail.jpg',
    gallery: ['/products/acc3.jpg', '/products/acc3-detail.jpg', '/products/acc3.svg'],
    stock: 15,
    sizes: ['Free Size'],
    description:
      'Museum-grade Bikaneri Jadau Kundan & uncut Polki bridal necklace set with matching chandelier earrings and pastel tourmaline drops.',
    description_hi:
      'मैचिंग झुमकों और पेस्टल रत्नों के साथ राजपूती बीकानेरी जड़ाऊ कुंदन ब्राइडल चोकर नेकलेस सेट।',
    rating: 5.0,
    reviews_count: 91,
    badge: 'Bridal Heirloom',
    badge_hi: 'ब्राइडल हेरिटेज',
    featured: true,
    is_demo: true,
  },
  {
    id: 12,
    name: 'Maharani Emerald & Ruby Kundan Necklace Set',
    name_hi: 'महारानी पन्ना और माणिक कुंदन नेकलेस सेट',
    category: 'accessory',
    price_paise: 34900,
    original_price_paise: 59900,
    image_url: '/products/acc4.jpg',
    hover_image_url: '/products/acc4-detail.jpg',
    gallery: ['/products/acc4.jpg', '/products/acc4-detail.jpg', '/products/acc4.svg'],
    stock: 0,
    sizes: ['Free Size'],
    description:
      'Hand-set emerald and ruby cabochon kundan collar necklace with woven gold dori tie and freshwater pearl clusters.',
    description_hi:
      'पन्ना और माणिक कुंदन जड़ित शाही नेकलेस, पिरोए हुए मोती और गोल्डन डोरी के साथ।',
    rating: 4.8,
    reviews_count: 64,
    featured: false,
    is_demo: true,
  },
];

export function enrichProduct(raw: Partial<Product> & { id: number; name: string }): Product {
  const match = DEMO_PRODUCTS.find((p) => p.id === Number(raw.id));
  const rawImg = raw.image_url || match?.image_url || '/products/kurti1.jpg';
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
    hover_image_url: raw.hover_image_url ?? match?.hover_image_url,
    gallery: raw.gallery ?? match?.gallery ?? [normalizedImg],
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
