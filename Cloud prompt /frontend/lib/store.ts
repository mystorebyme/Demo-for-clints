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

export type CustomerProfile = {
  email: string;
  name: string;
  phone: string;
  pincode: string;
  cityState: string;
  address: string;
  sessionToken?: string;
  emailVerified?: boolean;
  connectedAt?: string | null;
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
const PROFILE_STORAGE_KEY = 'fashion-customer-profile-v1';
const ORDER_TOKENS_STORAGE_KEY = 'fashion-order-tokens-v1';

export function saveOrderAccessToken(orderId: string, token: string) {
  if (typeof window === 'undefined' || !orderId || !token) return;
  try {
    const raw = window.localStorage.getItem(ORDER_TOKENS_STORAGE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[orderId.toUpperCase()] = token;
    window.localStorage.setItem(ORDER_TOKENS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getOrderAccessToken(orderId: string): string {
  if (typeof window === 'undefined' || !orderId) return '';
  try {
    const raw = window.localStorage.getItem(ORDER_TOKENS_STORAGE_KEY);
    if (!raw) return '';
    const map: Record<string, string> = JSON.parse(raw);
    return map[orderId.toUpperCase()] || '';
  } catch {
    return '';
  }
}

const DEFAULT_PROFILE: CustomerProfile = {
  email: '',
  name: '',
  phone: '',
  pincode: '',
  cityState: 'Jaipur, Rajasthan',
  address: '',
  emailVerified: false,
};

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

function loadInitialProfile(): CustomerProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      email: typeof parsed?.email === 'string' ? parsed.email : '',
      name: typeof parsed?.name === 'string' ? parsed.name : '',
      phone: typeof parsed?.phone === 'string' ? parsed.phone : '',
      pincode: typeof parsed?.pincode === 'string' ? parsed.pincode : '',
      cityState:
        typeof parsed?.cityState === 'string' && parsed.cityState
          ? parsed.cityState
          : 'Jaipur, Rajasthan',
      address: typeof parsed?.address === 'string' ? parsed.address : '',
      sessionToken: typeof parsed?.sessionToken === 'string' ? parsed.sessionToken : '',
      emailVerified: Boolean(parsed?.emailVerified),
      connectedAt: typeof parsed?.connectedAt === 'string' ? parsed.connectedAt : null,
    };
  } catch {
    return DEFAULT_PROFILE;
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

function saveProfile(profile: CustomerProfile) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

type State = {
  lang: Lang;
  hydrated: boolean;
  cart: CartItem[];
  wishlist: number[];
  compareList: number[];
  appliedCoupon: string;
  customerProfile: CustomerProfile;
  hydrate: () => void;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  addToCart: (item: CartItem) => void;
  updateQty: (id: number, size: string | undefined, qty: number) => void;
  removeFromCart: (id: number, size?: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: number) => boolean;
  setWishlist: (ids: number[]) => void;
  toggleCompare: (id: number) => boolean;
  clearCompare: () => void;
  setAppliedCoupon: (code: string) => void;
  setCustomerProfile: (partial: Partial<CustomerProfile>) => void;
  disconnectCustomerProfile: () => void;
  totalCount: () => number;
  totalPaise: () => number;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

export const useStore = create<State>((set, get) => ({
  lang: 'en',
  hydrated: false,
  cart: [],
  wishlist: [],
  compareList: [],
  appliedCoupon: '',
  customerProfile: DEFAULT_PROFILE,

  hydrate: () => {
    if (get().hydrated) return;
    set({
      lang: loadInitialLang(),
      cart: loadInitialCart(),
      wishlist: loadInitialWishlist(),
      appliedCoupon: loadInitialCoupon(),
      customerProfile: loadInitialProfile(),
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
        : [
            ...state.cart,
            { ...item, size: normalizedSize, qty: Math.min(10, Math.max(1, item.qty)) },
          ];
      saveCart(nextCart);
      return { cart: nextCart };
    }),

  updateQty: (id, size, qty) =>
    set((state) => {
      const normalizedSize = size || 'Free Size';
      const nextCart =
        qty <= 0
          ? state.cart.filter(
              (x) => !(x.id === id && (x.size || 'Free Size') === normalizedSize)
            )
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
    const { email, sessionToken } = get().customerProfile;
    if (email && sessionToken && typeof window !== 'undefined') {
      fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-token': sessionToken,
        },
        body: JSON.stringify({ email, sessionToken, wishlist: next }),
      }).catch(() => {});
    }
    return !exists;
  },

  setWishlist: (ids) => {
    const clean = Array.from(new Set(ids.filter((n) => typeof n === 'number')));
    saveWishlist(clean);
    set({ wishlist: clean });
  },

  toggleCompare: (id) => {
    const current = get().compareList;
    const exists = current.includes(id);
    const next = exists
      ? current.filter((x) => x !== id)
      : [...current, id].slice(-4);
    set({ compareList: next });
    return !exists;
  },

  clearCompare: () => {
    set({ compareList: [] });
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

  setCustomerProfile: (partial) => {
    const updated: CustomerProfile = {
      ...get().customerProfile,
      ...partial,
    };
    saveProfile(updated);
    set({ customerProfile: updated });
    if (updated.email && updated.sessionToken && typeof window !== 'undefined') {
      fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-token': updated.sessionToken,
        },
        body: JSON.stringify({
          email: updated.email,
          sessionToken: updated.sessionToken,
          name: updated.name,
          phone: updated.phone,
          pincode: updated.pincode,
          cityState: updated.cityState,
          address: updated.address,
          wishlist: get().wishlist,
        }),
      }).catch(() => {});
    }
  },

  disconnectCustomerProfile: () => {
    saveProfile(DEFAULT_PROFILE);
    set({ customerProfile: DEFAULT_PROFILE });
  },

  totalCount: () => get().cart.reduce((sum, item) => sum + item.qty, 0),

  totalPaise: () => get().cart.reduce((sum, item) => sum + item.price_paise * item.qty, 0),

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

export const formatINR = rupees;

export function rupeesInWords(paise: number): string {
  const amount = Math.round((Number(paise) || 0) / 100);
  if (amount <= 0) return 'Rupees Zero Only';
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (n: number): string => {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? ' ' + ones[n % 10] : ''}`;
  };

  const parts: string[] = [];
  let rem = amount;
  if (rem >= 100000) {
    parts.push(`${twoDigits(Math.floor(rem / 100000))} Lakh`);
    rem %= 100000;
  }
  if (rem >= 1000) {
    parts.push(`${twoDigits(Math.floor(rem / 1000))} Thousand`);
    rem %= 1000;
  }
  if (rem >= 100) {
    parts.push(`${ones[Math.floor(rem / 100)]} Hundred`);
    rem %= 100;
  }
  if (rem > 0) {
    parts.push(twoDigits(rem));
  }
  return `Rupees ${parts.join(' ')} Only`;
}

export function validateIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function validatePincode(pincode: string): boolean {
  return /^[1-9]\d{5}$/.test(pincode.trim());
}

export function validateCheckoutForm(input: {
  name: string;
  phone: string;
  address: string;
  email?: string;
  pincode?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Please enter a valid full name (at least 2 characters).';
  }
  if (!validateIndianPhone(input.phone || '')) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6–9.';
  }
  if (input.email !== undefined && input.email.trim() !== '' && !validateEmail(input.email)) {
    errors.email = 'Please enter a valid email address to receive your GST receipt & Tracking ID.';
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
  const text = `Explore *${product.name}* (${product.name_hi || ''}) — *${rupees(
    product.price_paise
  )}* at Zariya Jaipur Royal Ethnic House.\nView piece: ${origin}/products/${product.id}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppOrderUrl(product: {
  id: number;
  name: string;
  price_paise: number;
  size?: string;
}): string {
  const text = `Hello Zariya Jaipur Boutique,\nI would like to inquire about:\n• *Piece*: ${
    product.name
  } (#${product.id})\n• *Price*: ${rupees(product.price_paise)}\n• *Size*: ${
    product.size || 'Free Size'
  }\nPlease share availability & dispatch details.`;
  return `https://wa.me/919876543210?text=${encodeURIComponent(text)}`;
}
