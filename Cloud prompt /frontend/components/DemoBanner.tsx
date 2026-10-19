'use client';

import React from 'react';
import { useStore } from '../lib/store';

export default function DemoBanner() {
  const { t } = useStore();
  return (
    <div
      role="region"
      aria-label="Boutique Assurance Notice"
      className="bg-amber-100 border-b border-amber-300 text-amber-950 text-xs sm:text-sm py-2 px-4 text-center font-medium"
    >
      <span className="inline-block bg-amber-300 text-amber-950 font-bold px-2 py-0.5 rounded mr-2 uppercase tracking-wider text-[11px]">
        JAIPUR ATELIER
      </span>
      {t('demoNoticeBanner')}
    </div>
  );
}
