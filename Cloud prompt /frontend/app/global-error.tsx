'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#faf7f2] p-4 text-center text-stone-900">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 shadow-sm space-y-4">
          <h1 className="text-xl font-bold">Zariya Jaipur — Royal Ethnic House</h1>
          <p className="text-sm text-stone-600">
            Please tap below to refresh your boutique session.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-xl bg-rose-900 text-white text-xs font-bold"
          >
            Refresh Boutique
          </button>
        </div>
      </body>
    </html>
  );
}
