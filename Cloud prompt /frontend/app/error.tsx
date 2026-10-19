'use client';

import React from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf7f2] px-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 shadow-sm space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-rose-900 flex items-center justify-center text-2xl font-serif font-bold">
          ✦
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-extrabold text-stone-900">
          Refreshing Your Boutique View
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          We encountered a momentary connection pause while loading this page. Your shopping bag and saved items are completely safe.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs font-extrabold shadow-sm transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-bold transition"
          >
            Return to Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
