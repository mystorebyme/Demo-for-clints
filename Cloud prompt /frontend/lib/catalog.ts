export type ProductCategory = 'kurti' | 'bag' | 'accessory';

export type Product = {
  id: number;
  name: string;
  name_hi: string | null;
  category: ProductCategory;
  price_paise: number;
  image_url: string;
  gallery?: string[];
  stock: number;
  description?: string;
  description_hi?: string;
  fabric_or_material?: string;
  fabric_or_material_hi?: string;
  care_instructions?: string;
  care_instructions_hi?: string;
  sizes?: string[];
  featured?: boolean;
  is_demo?: boolean;
  created_at?: string;
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Cotton Straight Kurti',
    name_hi: 'कॉटन स्ट्रेट कुर्ती',
    category: 'kurti',
    price_paise: 79900,
    image_url: '/products/kurti1.svg',
    gallery: ['/products/kurti1.svg', '/products/kurti1-detail.svg'],
    stock: 50,
    description:
      'Breathable 100% pure Jaipuri block-print straight kurti with three-quarter sleeves and subtle gota-patti neckline detailing. Ideal for everyday work and casual wear.',
    description_hi:
      '100% शुद्ध जयपुरी ब्लॉक-प्रिंट सूती स्ट्रेट कुर्ती, थ्री-क्वार्टर आस्तीन और गोटा-पट्टी नेकलाइन वर्क के साथ। रोज़मर्रा और ऑफिस पहनने के लिए आरामदायक।',
    fabric_or_material: '100% Pure Cambric Cotton (60x60)',
    fabric_or_material_hi: '100% शुद्ध कैम्ब्रिक कॉटन (60x60)',
    care_instructions: 'Gentle hand wash separately in cold water; dry in shade.',
    care_instructions_hi: 'ठंडे पानी में अलग से हल्के हाथ से धोएँ; छाँव में सुखाएँ।',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    featured: true,
    is_demo: true,
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Anarkali Printed Kurti',
    name_hi: 'अनारकली प्रिंटेड कुर्ती',
    category: 'kurti',
    price_paise: 129900,
    image_url: '/products/kurti2.svg',
    gallery: ['/products/kurti2.svg', '/products/kurti2-detail.svg'],
    stock: 40,
    description:
      'Graceful 16-kali flared Anarkali kurti crafted in soft viscose rayon with traditional festive foil motifs and woven zari border at the hemline.',
    description_hi:
      'मुलायम रेयॉन फ़ैब्रिक में बनी 16-कली घेरदार अनारकली कुर्ती, पारंपरिक फेस्टिव फ़ॉइल प्रिंट और ज़री बॉर्डर के साथ।',
    fabric_or_material: 'Premium Liva-Certified Viscose Rayon',
    fabric_or_material_hi: 'प्रीमियम विस्कोस रेयॉन',
    care_instructions: 'Mild hand wash; iron on reverse side only.',
    care_instructions_hi: 'हल्के हाथ से धोएँ; उल्टी तरफ़ से ही प्रेस करें।',
    sizes: ['S', 'M', 'L', 'XL'],
    featured: true,
    is_demo: true,
    created_at: '2026-10-03T10:00:00Z',
  },
  {
    id: 3,
    name: 'Chikankari Kurti',
    name_hi: 'चिकनकारी कुर्ती',
    category: 'kurti',
    price_paise: 189900,
    image_url: '/products/kurti3.svg',
    gallery: ['/products/kurti3.svg', '/products/kurti3-detail.svg'],
    stock: 7,
    description:
      'Authentic Lucknowi hand-embroidered Chikankari kurti featuring intricate bakhiya and phanda stitches over pastel modal cotton. Includes matching inner slip.',
    description_hi:
      'असली लखनवी हैंड-एम्ब्रॉयडरी चिकनकारी कुर्ती, पेस्टल मोडल कॉटन पर बारीक बखिया और फंदा कढ़ाई के साथ। मैचिंग इनर स्लिप सहित।',
    fabric_or_material: 'Soft Modal Cotton with Resham Thread Embroidery',
    fabric_or_material_hi: 'सॉफ्ट मोडल कॉटन और रेशम धागे की कढ़ाई',
    care_instructions: 'Dry clean recommended or delicate cold hand wash.',
    care_instructions_hi: 'ड्राई क्लीन या ठंडे पानी में नाज़ुक हाथ से धोएँ।',
    sizes: ['S', 'M', 'L', 'XL'],
    featured: true,
    is_demo: true,
    created_at: '2026-10-06T10:00:00Z',
  },
  {
    id: 4,
    name: 'Leather Sling Bag',
    name_hi: 'लेदर स्लिंग बैग',
    category: 'bag',
    price_paise: 99900,
    image_url: '/products/bag1.svg',
    gallery: ['/products/bag1.svg', '/products/bag1-detail.svg'],
    stock: 30,
    description:
      'Compact tan vegan leather crossbody sling bag with antique brass magnetic buckle, adjustable shoulder strap, and two zippered interior compartments.',
    description_hi:
      'एंटीक ब्रास मैग्नेटिक बकल, एडजस्टेबल शोल्डर स्ट्रैप और दो ज़िप कम्पार्टमेंट वाला टैन वीगन लेदर क्रॉसबॉडी स्लिंग बैग।',
    fabric_or_material: 'Cruelty-Free Textured PU Vegan Leather & Brass Hardware',
    fabric_or_material_hi: 'टेक्सचर्ड वीगन लेदर और ब्रास हार्डवेयर',
    care_instructions: 'Wipe clean with a soft damp cloth; keep away from direct heat.',
    care_instructions_hi: 'मुलायम गीले कपड़े से साफ़ करें; तेज़ धूप से बचाएँ।',
    sizes: ['Free Size'],
    featured: true,
    is_demo: true,
    created_at: '2026-10-08T10:00:00Z',
  },
  {
    id: 5,
    name: 'Embroidered Potli Bag',
    name_hi: 'एम्ब्रॉयडरी पोटली बैग',
    category: 'bag',
    price_paise: 59900,
    image_url: '/products/bag2.svg',
    gallery: ['/products/bag2.svg', '/products/bag2-detail.svg'],
    stock: 60,
    description:
      'Festive crimson raw-silk potli bag adorned with golden zardosi embroidery, braided drawstring tassels, and a multi-strand pearl wrist handle.',
    description_hi:
      'गोल्डन ज़रदोज़ी कढ़ाई, लटकन डोरी और मोतियों के हैंडल से सजा फेस्टिव रॉ-सिल्क पोटली बैग। शादी और त्योहारों के लिए उपयुक्त।',
    fabric_or_material: 'Dupion Silk Exterior with Satin Lining & Pearl Handle',
    fabric_or_material_hi: 'डुपियन सिल्क, साटन लाइनिंग और पर्ल हैंडल',
    care_instructions: 'Spot clean only; store inside dust bag provided.',
    care_instructions_hi: 'केवल स्पॉट क्लीन करें; डस्ट बैग में सुरक्षित रखें।',
    sizes: ['Free Size'],
    featured: false,
    is_demo: true,
    created_at: '2026-10-09T10:00:00Z',
  },
  {
    id: 6,
    name: 'Tote Handbag',
    name_hi: 'टोट हैंडबैग',
    category: 'bag',
    price_paise: 149900,
    image_url: '/products/bag3.svg',
    gallery: ['/products/bag3.svg', '/products/bag3-detail.svg'],
    stock: 5,
    description:
      'Structured everyday office & travel tote handbag featuring a padded 14-inch laptop sleeve, reinforced dual handles, and top zip closure.',
    description_hi:
      'ऑफिस और यात्रा के लिए स्ट्रक्चर्ड टोट हैंडबैग, 14-इंच पैडेड लैपटॉप स्लीव, मज़बूत डबल हैंडल और टॉप ज़िप क्लोज़र के साथ।',
    fabric_or_material: 'Heavy-Duty Canvas & Faux Leather Trim',
    fabric_or_material_hi: 'हेवी-ड्यूटी कैनवास और फॉक्स लेदर ट्रिम',
    care_instructions: 'Wipe with dry or slightly damp cloth.',
    care_instructions_hi: 'सूखे या हल्के गीले कपड़े से पोंछें।',
    sizes: ['Free Size'],
    featured: true,
    is_demo: true,
    created_at: '2026-10-11T10:00:00Z',
  },
  {
    id: 7,
    name: 'Oxidised Jhumka Earrings',
    name_hi: 'ऑक्सीडाइज़्ड झुमके',
    category: 'accessory',
    price_paise: 29900,
    image_url: '/products/acc1.svg',
    gallery: ['/products/acc1.svg', '/products/acc1-detail.svg'],
    stock: 100,
    description:
      'Handcrafted German-silver oxidised dome jhumka earrings with floral stud tops and delicate ghungroo droplet fringes. Nickel-free and skin-safe.',
    description_hi:
      'फ्लोरल स्टड और घुंघरू लटकन वाले हैंडक्राफ्टेड जर्मन-सिल्वर ऑक्सीडाइज़्ड झुमके। निकल-फ्री और त्वचा के लिए सुरक्षित।',
    fabric_or_material: 'Nickel-Free Oxidised Brass & German Silver Alloy',
    fabric_or_material_hi: 'निकल-फ्री ऑक्सीडाइज़्ड ब्रास और जर्मन सिल्वर अलॉय',
    care_instructions: 'Keep away from perfumes and water; store in airtight pouch.',
    care_instructions_hi: 'परफ्यूम और पानी से दूर रखें; एयरटाइट पाउच में रखें।',
    sizes: ['Free Size'],
    featured: true,
    is_demo: true,
    created_at: '2026-10-12T10:00:00Z',
  },
  {
    id: 8,
    name: 'Silk Dupatta',
    name_hi: 'सिल्क दुपट्टा',
    category: 'accessory',
    price_paise: 49900,
    image_url: '/products/acc2.svg',
    gallery: ['/products/acc2.svg', '/products/acc2-detail.svg'],
    stock: 45,
    description:
      'Rich crimson Banarasi art-silk dupatta (2.4 meters) woven with traditional golden zari buti motifs and knotted pallu tassels.',
    description_hi:
      'पारंपरिक गोल्डन ज़री बूटी और पल्लू टैसल के साथ बुना हुआ 2.4 मीटर लंबा बनारसी आर्ट-सिल्क दुपट्टा।',
    fabric_or_material: 'Banarasi Art Silk with Woven Zari Border (2.4m x 0.9m)',
    fabric_or_material_hi: 'बनारसी आर्ट सिल्क और ज़री बॉर्डर (2.4m x 0.9m)',
    care_instructions: 'Dry clean or gentle cold wash.',
    care_instructions_hi: 'ड्राई क्लीन या हल्के ठंडे पानी में धोएँ।',
    sizes: ['Free Size'],
    featured: false,
    is_demo: true,
    created_at: '2026-10-14T10:00:00Z',
  },
  {
    id: 9,
    name: 'Bangles Set (6 pcs)',
    name_hi: 'चूड़ी सेट (6 पीस)',
    category: 'accessory',
    price_paise: 39900,
    image_url: '/products/acc3.svg',
    gallery: ['/products/acc3.svg', '/products/acc3-detail.svg'],
    stock: 80,
    description:
      'Set of 6 gold-plated Kundan and Rajasthani Meenakari bangles designed to pair effortlessly with ethnic kurtis and festive sarees.',
    description_hi:
      'कुंदन और राजस्थानी मीनाकारी वर्क वाली 6 गोल्ड-प्लेटेड चूड़ियों का सेट, कुर्ती और साड़ी के साथ पहनने के लिए आकर्षक।',
    fabric_or_material: 'Gold-Toned Alloy with Kundan Stones & Enamel Work',
    fabric_or_material_hi: 'गोल्ड-टोन अलॉय, कुंदन स्टोन और मीनाकारी वर्क',
    care_instructions: 'Wipe with soft cotton cloth after wear; avoid moisture.',
    care_instructions_hi: 'पहनने के बाद सूती कपड़े से साफ़ करें; नमी से बचाएँ।',
    sizes: ['2.4', '2.6', '2.8'],
    featured: false,
    is_demo: true,
    created_at: '2026-10-15T10:00:00Z',
  },
  {
    id: 10,
    name: 'Indigo Ajrakh A-Line Kurti',
    name_hi: 'इंडिगो अजरख ए-लाइन कुर्ती',
    category: 'kurti',
    price_paise: 114900,
    image_url: '/products/kurti4.svg',
    gallery: ['/products/kurti4.svg', '/products/kurti4-detail.svg'],
    stock: 22,
    description:
      'Hand-block printed Indigo Ajrakh A-line kurti featuring side pockets, wooden button placket, and breathable mulmul cotton comfort.',
    description_hi:
      'साइड पॉकेट, लकड़ी के बटन और मुलायम मलमल कॉटन में बनी हैंड-ब्लॉक प्रिंटेड इंडिगो अजरख ए-लाइन कुर्ती।',
    fabric_or_material: '100% Natural Dyed Mulmul Cotton',
    fabric_or_material_hi: '100% नेचुरल डाई मलमल कॉटन',
    care_instructions: 'Wash separately the first two times due to natural indigo dye.',
    care_instructions_hi: 'प्राकृतिक इंडिगो डाई के कारण पहली दो बार अलग धोएँ।',
    sizes: ['S', 'M', 'L', 'XL'],
    featured: false,
    is_demo: true,
    created_at: '2026-10-16T10:00:00Z',
  },
  {
    id: 11,
    name: 'Handcrafted Jute & Ikat Shoulder Bag',
    name_hi: 'हैंडक्राफ्टेड जूट और इकत शोल्डर बैग',
    category: 'bag',
    price_paise: 84900,
    image_url: '/products/bag4.svg',
    gallery: ['/products/bag4.svg', '/products/bag4-detail.svg'],
    stock: 18,
    description:
      'Eco-friendly braided jute shoulder bag accented with handwoven Pochampally Ikat fabric panels and padded cotton straps.',
    description_hi:
      'हाथ से बुने पोचमपल्ली इकत पैनल और पैडेड कॉटन स्ट्रैप के साथ इको-फ्रेंडली जूट शोल्डर बैग।',
    fabric_or_material: 'Natural Braided Jute & Handloom Ikat Cotton',
    fabric_or_material_hi: 'प्राकृतिक जूट और हैंडलूम इकत कॉटन',
    care_instructions: 'Brush off dust gently; do not machine wash.',
    care_instructions_hi: 'धूल को हल्के ब्रश से साफ़ करें; मशीन में न धोएँ।',
    sizes: ['Free Size'],
    featured: false,
    is_demo: true,
    created_at: '2026-10-17T10:00:00Z',
  },
  {
    id: 12,
    name: 'Pearl & Mirror Work Hair Clip Set',
    name_hi: 'पर्ल और मिरर वर्क हेयर क्लिप सेट',
    category: 'accessory',
    price_paise: 24900,
    image_url: '/products/acc4.svg',
    gallery: ['/products/acc4.svg', '/products/acc4-detail.svg'],
    stock: 0,
    description:
      'Artisanal pair of festive hair barrettes embellished with faux pearls and Kutchi mirror embroidery. Currently out of stock to demonstrate stock-state handling.',
    description_hi:
      'फॉक्स पर्ल और कच्छी मिरर कढ़ाई से सजे फेस्टिव हेयर क्लिप का सेट। (स्टॉक-स्टेट डेमो के लिए वर्तमान में स्टॉक समाप्त)।',
    fabric_or_material: 'Metal Snap Clip Base with Pearl & Mirror Work',
    fabric_or_material_hi: 'मेटल क्लिप बेस, पर्ल और मिरर वर्क',
    care_instructions: 'Store in dry jewellery box.',
    care_instructions_hi: 'सूखे ज्वेलरी बॉक्स में रखें।',
    sizes: ['Free Size'],
    featured: false,
    is_demo: true,
    created_at: '2026-10-18T10:00:00Z',
  },
];

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'name-asc';

export type CatalogFilterOptions = {
  category?: 'all' | ProductCategory;
  query?: string;
  sort?: SortOption;
  inStockOnly?: boolean;
};

/**
 * Enriches raw database product rows (which only store id, name, name_hi, category, price_paise, image_url, stock)
 * with rich bilingual metadata from DEMO_PRODUCTS when matching by id or name.
 */
export function enrichProduct(raw: Product): Product {
  const match = DEMO_PRODUCTS.find((d) => d.id === raw.id || d.name === raw.name);
  const normalizedImg = raw.image_url?.replace(/\.webp$/i, '.svg') || match?.image_url || '/products/kurti1.svg';
  if (!match) {
    return {
      ...raw,
      image_url: normalizedImg,
      gallery: [normalizedImg],
      sizes: raw.category === 'kurti' ? ['S', 'M', 'L', 'XL'] : ['Free Size'],
      is_demo: true,
    };
  }
  return {
    ...match,
    ...raw,
    image_url: normalizedImg,
    gallery: match.gallery || [normalizedImg],
    is_demo: true,
  };
}

export function filterAndSortProducts(products: Product[], opts: CatalogFilterOptions): Product[] {
  const { category = 'all', query = '', sort = 'featured', inStockOnly = false } = opts;
  const needle = query.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (inStockOnly && p.stock <= 0) return false;
    if (!needle) return true;
    const haystacks = [
      p.name,
      p.name_hi || '',
      p.category,
      p.description || '',
      p.description_hi || '',
      p.fabric_or_material || '',
      p.fabric_or_material_hi || '',
    ];
    return haystacks.some((h) => h.toLowerCase().includes(needle));
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.price_paise - b.price_paise;
      case 'price-desc':
        return b.price_paise - a.price_paise;
      case 'newest':
        return (b.id || 0) - (a.id || 0);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'featured':
      default: {
        const fa = a.featured ? 1 : 0;
        const fb = b.featured ? 1 : 0;
        if (fb !== fa) return fb - fa;
        return a.id - b.id;
      }
    }
  });

  return sorted;
}

export function paginateProducts<T>(items: T[], page: number, pageSize: number): {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
} {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
    totalItems,
  };
}
