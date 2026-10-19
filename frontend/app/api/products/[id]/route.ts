import { NextResponse } from 'next/server';
import { enrichProduct } from '../../../../lib/catalog';
import { getServerProductById, tryProxyBackend } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ success: false, error: 'Invalid product ID.' }, { status: 400 });
  }

  const upstream = await tryProxyBackend(`/api/products`);
  if (upstream && upstream.ok) {
    const data = await upstream.json();
    if (Array.isArray(data.products)) {
      const match = data.products.find((p: any) => Number(p.id) === id);
      if (match) {
        return NextResponse.json({ success: true, product: enrichProduct(match) });
      }
    }
  }

  const product = getServerProductById(id);
  if (!product) {
    return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, product });
}
