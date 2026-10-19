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
    name: 'Cotton Straight Kurti',
    name_hi: 'कॉटन स्ट्रेट कुर्ती',
    category: 'kurti',
    price_paise: 79900,
    original_price_paise: 119900,
    image_url: '/products/kurti1.svg',
    stock: 50,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Breathable hand-block printed Jaipur cotton straight kurti with delicate gota-patti neckline detailing. Ideal for everyday elegance and office wear.',
    description_hi:
      'हल्के गोटा-पट्टी वर्क और हैंड-ब्लॉक प्रिंट वाली आरामदायक जयपुर सूती स्ट्रेट कुर्ती। रोज़मर्रा और ऑफिस के लिए बेहतरीन।',
    rating: 4.8,
    reviews_count: 142,
    badge: 'Bestseller',
    badge_hi: 'सबसे लोकप्रिय',
    featured: true,
    is_demo: true,
  },
  {
    id: 2,
    name: 'Festive Anarkali Kurti',
    name_hi: 'फेस्टिव अनारकली कुर्ती',
    category: 'kurti',
    price_paise: 129900,
    original_price_paise: 189900,
    image_url: '/products/kurti2.svg',
    stock: 35,
    sizes: ['M', 'L', 'XL'],
    description:
      'Royal maroon flared Anarkali kurti with golden zari embroidery on the yoke and cuffs. Crafted for weddings, pujas, and festive celebrations.',
    description_hi:
      'सुनहरे ज़री वर्क और घेरदार डिज़ाइन वाली रॉयल मैरून अनारकली कुर्ती। त्योहारों और शादी-समारोह के लिए खास।',
    rating: 4.9,
    reviews_count: 98,
    badge: 'Festive Pick',
    badge_hi: 'त्योहार विशेष',
    featured: true,
    is_demo: true,
  },
  {
    id: 3,
    name: 'Pastel Chikankari Kurti',
    name_hi: 'पेस्टल चिकनकारी कुर्ती',
    category: 'kurti',
    price_paise: 99900,
    original_price_paise: 149900,
    image_url: '/products/kurti3.svg',
    stock: 25,
    sizes: ['S', 'M', 'L'],
    description:
      'Soft mulmul pastel kurti featuring authentic Lucknowi thread work and pearl buttons. Feather-light comfort for warm days.',
    description_hi:
      'लखनवी चिकनकारी कढ़ाई और मोती के बटनों वाली मुलायम मलमल पेस्टल कुर्ती। गर्मियों के लिए बेहद आरामदायक।',
    rating: 4.7,
    reviews_count: 76,
    featured: true,
    is_demo: true,
  },
  {
    id: 4,
    name: 'Royal Silk Blend Kurti',
    name_hi: 'रॉयल सिल्क ब्लेंड कुर्ती',
    category: 'kurti',
    price_paise: 159900,
    original_price_paise: 229900,
    image_url: '/products/kurti4.svg',
    stock: 4,
    sizes: ['M', 'L', 'XL', 'XXL'],
    description:
      'Chanderi silk-blend straight kurta with woven brocade motifs and a rich festive sheen.',
    description_hi:
      'ब्रोकेड बुनाई और शाही चमक वाली चंदेरी सिल्क-ब्लेंड कुर्ती।',
    rating: 4.9,
    reviews_count: 54,
    badge: 'Limited Edition',
    badge_hi: 'सीमित स्टॉक',
    featured: true,
    is_demo: true,
  },
  {
    id: 5,
    name: 'Handcrafted Tote Bag',
    name_hi: 'हैंडक्राफ्टेड टोट बैग',
    category: 'bag',
    price_paise: 99900,
    original_price_paise: 139900,
    image_url: '/products/bag1.svg',
    stock: 20,
    sizes: ['Free Size'],
    description:
      'Spacious Dabu-printed canvas tote with vegan leather handles, padded laptop compartment, and secure brass zipper.',
    description_hi:
      'दाबू प्रिंट कैनवास और वीगन लेदर हैंडल वाला बड़ा टोट बैग, ज़िपर और लैपटॉप पॉकेट के साथ।',
    rating: 4.8,
    reviews_count: 89,
    badge: 'Artisan Made',
    badge_hi: 'हस्तनिर्मित',
    featured: true,
    is_demo: true,
  },
  {
    id: 6,
    name: 'Ethnic Sling Bag',
    name_hi: 'एथनिक स्लिंग बैग',
    category: 'bag',
    price_paise: 59900,
    original_price_paise: 89900,
    image_url: '/products/bag2.svg',
    stock: 40,
    sizes: ['Free Size'],
    description:
      'Compact mirror-work cross-body sling bag with adjustable braided strap and magnetic flap closure.',
    description_hi:
      'मिरर-वर्क और एडजस्टेबल स्ट्रैप वाला सुंदर एथनिक स्लिंग बैग।',
    rating: 4.6,
    reviews_count: 112,
    featured: false,
    is_demo: true,
  },
  {
    id: 7,
    name: 'Oxidized Jhumka Earrings',
    name_hi: 'ऑक्सीडाइज़्ड झुमका इयररिंग्स',
    category: 'accessory',
    price_paise: 29900,
    original_price_paise: 49900,
    image_url: '/products/acc1.svg',
    stock: 100,
    sizes: ['Free Size'],
    description:
      'Lightweight nickel-free German silver oxidized dome jhumkas with delicate ghungroo drops.',
    description_hi:
      'घुंघरू की लटकन वाले हल्के जर्मन सिल्वर ऑक्सीडाइज़्ड झुमके।',
    rating: 4.9,
    reviews_count: 215,
    badge: 'Top Rated',
    badge_hi: 'टॉप रेटेड',
    featured: true,
    is_demo: true,
  },
  {
    id: 8,
    name: 'Jaipuri Jacquard Handbag',
    name_hi: 'जयपुरी जैकार्ड हैंडबैग',
    category: 'bag',
    price_paise: 119900,
    original_price_paise: 169900,
    image_url: '/products/bag4.svg',
    stock: 12,
    sizes: ['Free Size'],
    description:
      'Structured geometric jacquard handbag with twin top handles and detachable shoulder belt.',
    description_hi:
      'डबल हैंडल और शोल्डर बेल्ट के साथ मजबूत जयपुरी जैकार्ड हैंडबैग।',
    rating: 4.7,
    reviews_count: 41,
    featured: false,
    is_demo: true,
  },
  {
    id: 9,
    name: 'Embroidered Potli Bag',
    name_hi: 'कढ़ाईदार पोटली बैग',
    category: 'bag',
    price_paise: 49900,
    original_price_paise: 79900,
    image_url: '/products/bag3.svg',
    stock: 30,
    sizes: ['Free Size'],
    description:
      'Velvet bridal potli bag embellished with zardosi work and a beaded pearl wrist handle.',
    description_hi:
      'ज़रदोज़ी कढ़ाई और मोतियों के हैंडल वाला मखमली पोटली बैग।',
    rating: 4.8,
    reviews_count: 63,
    badge: 'Wedding Special',
    badge_hi: 'वेडिंग स्पेशल',
    featured: false,
    is_demo: true,
  },
  {
    id: 10,
    name: 'Embroidered Dupatta',
    name_hi: 'कढ़ाईदार दुपट्टा',
    category: 'accessory',
    price_paise: 44900,
    original_price_paise: 69900,
    image_url: '/products/acc2.svg',
    stock: 60,
    sizes: ['2.25 Meter'],
    description:
      'Full-length chiffon phulkari & gota-edged dupatta with handcraftedlatkan tassels.',
    description_hi:
      'गोटा किनारी और लटकन के साथ खूबसूरत फुलकारी शिफॉन दुपट्टा।',
    rating: 4.7,
    reviews_count: 84,
    featured: false,
    is_demo: true,
  },
  {
    id: 11,
    name: 'Kundan Pearl Choker Set',
    name_hi: 'कुंदन पर्ल चोकर सेट',
    category: 'accessory',
    price_paise: 64900,
    original_price_paise: 99900,
    image_url: '/products/acc3.svg',
    stock: 18,
    sizes: ['Free Size'],
    description:
      'Handcrafted Rajasthani kundan choker necklace with matching stud earrings and adjustable dori.',
    description_hi:
      'मैचिंग इयररिंग्स और डोरी के साथ राजस्थानी कुंदन पर्ल चोकर सेट।',
    rating: 4.8,
    reviews_count: 52,
    featured: false,
    is_demo: true,
  },
  {
    id: 12,
    name: 'Rajasthani Mirror Bangles',
    name_hi: 'राजस्थानी मिरर चूड़ियाँ',
    category: 'accessory',
    price_paise: 34900,
    original_price_paise: 54900,
    image_url: '/products/acc4.svg',
    stock: 0,
    sizes: ['2.4', '2.6', '2.8'],
    description:
      'Set of 6 handcrafted lac and mirror-work bangles from Jaipur artisans.',
    description_hi:
      'जयपुर के कारीगरों द्वारा निर्मित 6 लाख और मिरर-वर्क चूड़ियों का सेट।',
    rating: 4.6,
    reviews_count: 37,
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
