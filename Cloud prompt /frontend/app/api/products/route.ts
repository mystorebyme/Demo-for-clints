import { NextResponse } from 'next/server';
import { enrichProduct } from '../../../lib/catalog';
import { listServerProducts, tryProxyBackend } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const upstream = await tryProxyBackend('/api/products');
  if (upstream && upstream.ok) {
    const data = await upstream.json();
    if (Array.isArray(data.products)) {
      return NextResponse.json({
        success: true,
        products: data.products.map((p: any) => enrichProduct(p)),
      });
    }
  }
  return NextResponse.json({
    success: true,
    products: listServerProducts(),
  });
}
