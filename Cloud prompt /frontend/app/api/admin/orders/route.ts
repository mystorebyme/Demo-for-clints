import { NextResponse } from 'next/server';
import { getAdminStoreData, listServerProducts, tryProxyBackend, verifyAdminTokenHeader } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = req.headers.get('x-admin-token');

  const upstream = await tryProxyBackend('/api/admin/orders', {
    headers: { 'x-admin-token': token || '' },
  });
  if (upstream) {
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  }

  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { orders } = getAdminStoreData();
  const products = listServerProducts();
  return NextResponse.json({ success: true, orders, products });
}
