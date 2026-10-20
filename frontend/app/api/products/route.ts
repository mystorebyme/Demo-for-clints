import { NextResponse } from 'next/server';
import { enrichProduct } from '../../../lib/catalog';
import { getLiveProducts } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.BACKEND_INTERNAL_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/products`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const products = (data.products || []).map(enrichProduct);
        return NextResponse.json({
          success: true,
          demo: true,
          products,
        });
      }
    } catch {
      // Fall back to live server store catalog
    }
  }

  return NextResponse.json({
    success: true,
    demo: true,
    products: getLiveProducts(),
  });
}
