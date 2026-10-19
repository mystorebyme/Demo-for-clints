'use client';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import en from '../public/i18n/en.json';
import hi from '../public/i18n/hi.json';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type Product = {
  id: number;
  name: string;
  name_hi: string | null;
  category: 'kurti' | 'bag' | 'accessory';
  price_paise: number;
  image_url: string;
  stock: number;
};

export type CartLine = { id: number; name: string; name_hi: string | null; price_paise: number; image_url: string; qty: number };

type CartState = {
  lines: CartLine[];
  add: (p: Product) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (p) =>
        set((s) => {
          const ex = s.lines.find((l) => l.id === p.id);
          if (ex) return { lines: s.lines.map((l) => (l.id === p.id ? { ...l, qty: Math.min(l.qty + 1, 10) } : l)) };
          return { lines: [...s.lines, { id: p.id, name: p.name, name_hi: p.name_hi, price_paise: p.price_paise, image_url: p.image_url, qty: 1 }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({ lines: s.lines.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(qty, 10)) } : l)) })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'fashion-cart' }
  )
);

type Lang = 'en' | 'hi';
export const useLang = create<{ lang: Lang; setLang: (l: Lang) => void }>()(
  persist((set) => ({ lang: 'en', setLang: (lang) => set({ lang }) }), { name: 'fashion-lang' })
);

const dict: Record<Lang, Record<string, string>> = { en, hi };

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
  return { t: (key: string) => dict[active][key] ?? key, lang: active };
}

export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
