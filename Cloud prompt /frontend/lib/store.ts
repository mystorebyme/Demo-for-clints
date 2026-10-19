'use client';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import en from '../public/i18n/en.json';
import hi from '../public/i18n/hi.json';
import type { Product, ProductCategory } from './catalog';

export type { Product, ProductCategory };

// Relative URLs by default so browser requests work across any preview/proxy host without calling localhost:5000.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export type CartLine = {
  lineKey: string;
  id: number;
  name: string;
  name_hi: string | null;
  category?: ProductCategory;
  price_paise: number;
  image_url: string;
  size: string;
  qty: number;
  maxStock?: number;
};

type CartState = {
  lines: CartLine[];
  add: (p: Product, qty?: number, size?: string) => void;
  setQty: (id: number, qty: number, size?: string) => void;
  remove: (id: number, size?: string) => void;
  syncServerPrices: (serverItems: Array<{ id: number; price_paise: number; stock: number; name?: string }>) => void;
  clear: () => void;
};

function makeLineKey(id: number, size?: string): string {
  return `${id}:${size || 'Free Size'}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (p, qty = 1, size) =>
        set((s) => {
          if (p.stock <= 0) return s;
          const chosenSize = size || (p.sizes && p.sizes[0]) || 'Free Size';
          const lineKey = makeLineKey(p.id, chosenSize);
          const cap = Math.min(10, Math.max(1, p.stock));
          const ex = s.lines.find((l) => (l.lineKey || makeLineKey(l.id, l.size)) === lineKey);
          if (ex) {
            return {
              lines: s.lines.map((l) =>
                (l.lineKey || makeLineKey(l.id, l.size)) === lineKey
                  ? { ...l, qty: Math.min(l.qty + Math.max(1, qty), cap), maxStock: p.stock }
                  : l
              ),
            };
          }
          return {
            lines: [
              ...s.lines,
              {
                lineKey,
                id: p.id,
                name: p.name,
                name_hi: p.name_hi,
                category: p.category,
                price_paise: p.price_paise,
                image_url: p.image_url,
                size: chosenSize,
                qty: Math.min(Math.max(1, qty), cap),
                maxStock: p.stock,
              },
            ],
          };
        }),
      setQty: (id, qty, size) =>
        set((s) => ({
          lines: s.lines.map((l) => {
            const matches = size ? (l.lineKey || makeLineKey(l.id, l.size)) === makeLineKey(id, size) : l.id === id;
            if (!matches) return l;
            const cap = Math.min(10, l.maxStock ?? 10);
            return { ...l, qty: Math.max(1, Math.min(qty, cap)) };
          }),
        })),
      remove: (id, size) =>
        set((s) => ({
          lines: s.lines.filter((l) =>
            size ? (l.lineKey || makeLineKey(l.id, l.size)) !== makeLineKey(id, size) : l.id !== id
          ),
        })),
      syncServerPrices: (serverItems) =>
        set((s) => {
          const map = new Map(serverItems.map((i) => [i.id, i]));
          return {
            lines: s.lines
              .map((l) => {
                const sv = map.get(l.id);
                if (!sv) return l;
                if (sv.stock <= 0) return null;
                return {
                  ...l,
                  price_paise: sv.price_paise,
                  maxStock: sv.stock,
                  qty: Math.min(l.qty, Math.min(10, sv.stock)),
                };
              })
              .filter(Boolean) as CartLine[],
          };
        }),
      clear: () => set({ lines: [] }),
    }),
    { name: 'fashion-cart' }
  )
);

export type Lang = 'en' | 'hi';
export const useLang = create<{ lang: Lang; setLang: (l: Lang) => void }>()(
  persist((set) => ({ lang: 'en', setLang: (lang) => set({ lang }) }), { name: 'fashion-lang' })
);

export const DICTIONARIES: Record<Lang, Record<string, string>> = { en, hi };

// Avoids server/client mismatch for persisted (localStorage) state.
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

// Dictionaries are bundled, so switching language is instant (no network).
export function useT() {
  const lang = useLang((s) => s.lang);
  const hydrated = useHydrated();
  const active: Lang = hydrated ? lang : 'en';
  return {
    t: (key: string, vars?: Record<string, string | number>) => {
      let str = DICTIONARIES[active][key] ?? DICTIONARIES.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    lang: active,
  };
}

export const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function validateIndianPhone(phone: string): boolean {
  return /^[6-9][0-9]{9}$/.test(phone.trim());
}

export function validatePincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

export type CheckoutFormInput = {
  name: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export function validateCheckoutForm(input: CheckoutFormInput): { valid: boolean; error?: string } {
  const name = (input.name || '').trim();
  const phone = (input.phone || '').trim();
  const address = (input.address || '').trim();
  const pincode = (input.pincode || '').trim();

  if (name.length < 2 || name.length > 120) {
    return { valid: false, error: 'Please enter a valid full name (2–120 characters).' };
  }
  if (!validateIndianPhone(phone)) {
    return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number starting with 6–9.' };
  }
  if (pincode && !validatePincode(pincode)) {
    return { valid: false, error: 'Please enter a valid 6-digit PIN code.' };
  }
  if (address.length < 10 || address.length > 500) {
    return { valid: false, error: 'Please enter a complete delivery address (at least 10 characters).' };
  }
  return { valid: true };
}
