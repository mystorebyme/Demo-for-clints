import { NextResponse } from 'next/server';
import {
  tryProxyBackend,
  updateServerOrderTracking,
  verifyAdminTokenHeader,
} from '../../../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { orderId: string } }) {
  const token = req.headers.get('x-admin-token');
  const body = await req.json().catch(() => ({}));
  const { orderId } = params;

  const upstream = await tryProxyBackend(`/api/admin/orders/${encodeURIComponent(orderId)}/tracking`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token || '',
    },
    body: JSON.stringify(body),
  });
  if (upstream) {
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  }

  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const updated = updateServerOrderTracking(orderId, body);
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, order: updated });
}
