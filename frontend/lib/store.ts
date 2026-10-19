import { create } from 'zustand';
import enDict from '../public/i18n/en.json';
import hiDict from '../public/i18n/hi.json';

export type Lang = 'en' | 'hi';

export type CartItem = {
  id: number;
  name: string;
  name_hi?: string;
  price_paise: number;
  qty: number;
  size?: string;
  image_url?: string;
  category?: string;
};

type Dict = Record<string, string>;

export const DICTIONARIES: Record<Lang, Dict> = {
  en: enDict,
  hi: hiDict,
};

const CART_STORAGE_KEY = 'fashion-store-cart-v1';
const LANG_STORAGE_KEY = 'fashion-store-lang-v1';
const WISHLIST_STORAGE_KEY = 'fashion-wishlist-v1';
const COUPON_STORAGE_KEY = 'fashion-coupon-v1';

function loadInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) =>
        i &&
        typeof i.id === 'number' &&
        typeof i.name === 'string' &&
        typeof i.price_paise === 'number' &&
        typeof i.qty === 'number' &&
        i.qty > 0
    );
  } catch {
    return [];
  }
}

function loadInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    return saved === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

function loadInitialWishlist(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === 'number');
  } catch {
    return [];
  }
}

function loadInitialCoupon(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(COUPON_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore storage errors
  }
}

function saveWishlist(wishlist: number[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  } catch {
    // ignore
  }
}

type State = {
  lang: Lang;
  hydrated: boolean;
  cart: CartItem[];
  wishlist: number[];
  appliedCoupon: string;
  hydrate: () => void;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  addToCart: (item: CartItem) => void;
  updateQty: (id: number, size: string | undefined, qty: number) => void;
  removeFromCart: (id: number, size?: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: number) => boolean;
  setAppliedCoupon: (code: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

export const useStore = create<State>((set, get) => ({
  lang: 'en',
  hydrated: false,
  cart: [],
  wishlist: [],
  appliedCoupon: '',

  hydrate: () => {
    if (get().hydrated) return;
    set({
      lang: loadInitialLang(),
      cart: loadInitialCart(),
      wishlist: loadInitialWishlist(),
      appliedCoupon: loadInitialCoupon(),
      hydrated: true,
    });
  },

  setLang: (lang) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        // ignore
      }
    }
    set({ lang });
  },

  toggleLang: () => {
    const next: Lang = get().lang === 'en' ? 'hi' : 'en';
    get().setLang(next);
  },

  addToCart: (item) =>
    set((state) => {
      const normalizedSize = item.size || 'Free Size';
      const existing = state.cart.find(
        (x) => x.id === item.id && (x.size || 'Free Size') === normalizedSize
      );
      const nextCart = existing
        ? state.cart.map((x) =>
            x.id === item.id && (x.size || 'Free Size') === normalizedSize
              ? { ...x, qty: Math.min(10, x.qty + item.qty) }
              : x
          )
        : [...state.cart, { ...item, size: normalizedSize, qty: Math.min(10, Math.max(1, item.qty)) }];
      saveCart(nextCart);
      return { cart: nextCart };
    }),

  updateQty: (id, size, qty) =>
    set((state) => {
      const normalizedSize = size || 'Free Size';
      const nextCart =
        qty <= 0
          ? state.cart.filter((x) => !(x.id === id && (x.size || 'Free Size') === normalizedSize))
          : state.cart.map((x) =>
              x.id === id && (x.size || 'Free Size') === normalizedSize
                ? { ...x, qty: Math.min(10, qty) }
                : x
            );
      saveCart(nextCart);
      return { cart: nextCart };
    }),

  removeFromCart: (id, size) =>
    set((state) => {
      const nextCart = size
        ? state.cart.filter((x) => !(x.id === id && (x.size || 'Free Size') === size))
        : state.cart.filter((x) => x.id !== id);
      saveCart(nextCart);
      return { cart: nextCart };
    }),

  clearCart: () => {
    saveCart([]);
    set({ cart: [] });
  },

  toggleWishlist: (id) => {
    const current = get().wishlist;
    const exists = current.includes(id);
    const next = exists ? current.filter((x) => x !== id) : [...current, id];
    saveWishlist(next);
    set({ wishlist: next });
    return !exists;
  },

  setAppliedCoupon: (code) => {
    const clean = (code || '').trim().toUpperCase();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(COUPON_STORAGE_KEY, clean);
      } catch {
        // ignore
      }
    }
    set({ appliedCoupon: clean });
  },

  t: (key, vars) => {
    const lang = get().lang;
    const dict = DICTIONARIES[lang] || DICTIONARIES.en;
    let template = dict[key] || DICTIONARIES.en[key] || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        template = template.replace(`{${k}}`, String(v));
      }
    }
    return template;
  },
}));

export const rupees = (paise: number): string => {
  const inr = (Number(paise) || 0) / 100;
  return `₹${inr.toLocaleString('en-IN', {
    minimumFractionDigits: inr % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

export function validateIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function validatePincode(pincode: string): boolean {
  return /^[1-9]\d{5}$/.test(pincode.trim());
}

export function validateCheckoutForm(input: {
  name: string;
  phone: string;
  address: string;
  pincode?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Please enter a valid full name (at least 2 characters).';
  }
  if (!validateIndianPhone(input.phone || '')) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6–9.';
  }
  if (input.pincode !== undefined && input.pincode.trim() !== '' && !validatePincode(input.pincode)) {
    errors.pincode = 'Please enter a valid 6-digit Indian PIN code.';
  }
  if (!input.address || input.address.trim().length < 10) {
    errors.address = 'Please enter a complete delivery address (at least 10 characters).';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildWhatsAppShareUrl(product: {
  id: number;
  name: string;
  name_hi?: string;
  price_paise: number;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const text = `✨ Check out *${product.name}* (${product.name_hi || ''}) for just *${rupees(
    product.price_paise
  )}* at Kranti Classes Ethnic Wear!\n🛍️ View here: ${origin}/products/${product.id}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppOrderUrl(product: {
  id: number;
  name: string;
  price_paise: number;
  size?: string;
}): string {
  const text = `नमस्ते / Hello Kranti Classes Boutique! 🙏\nI want to order / inquire about:\n• *Product*: ${
    product.name
  } (#${product.id})\n• *Price*: ${rupees(product.price_paise)}\n• *Size*: ${
    product.size || 'Free Size'
  }\nPlease share availability & UPI details.`;
  return `https://wa.me/919876543210?text=${encodeURIComponent(text)}`;
}
