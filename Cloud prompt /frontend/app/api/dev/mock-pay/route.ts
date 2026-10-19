import { NextResponse } from 'next/server';
import { confirmServerOrder, tryProxyBackend } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.PAYMENT_MODE === 'razorpay') {
    return NextResponse.json({ success: false, error: 'Mock payments disabled in production.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const upstream = await tryProxyBackend('/api/dev/mock-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (upstream) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }

    const res = confirmServerOrder(String(body.orderId || ''), body.payment);
    if (!res.success && res.result === 'unknown_order') {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }
}
