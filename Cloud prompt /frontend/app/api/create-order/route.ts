import { NextResponse } from 'next/server';
import { createServerOrder, tryProxyBackend } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idempotencyKey = req.headers.get('x-idempotency-key') || undefined;

    const upstream = await tryProxyBackend('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {}),
      },
      body: JSON.stringify({
        customer: body.customer,
        items: (body.items || []).map((i: any) => ({ id: Number(i.id), qty: Number(i.qty) })),
      }),
    });

    if (upstream) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }

    const result = createServerOrder({
      customer: body.customer,
      items: body.items,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid order request payload.' }, { status: 400 });
  }
}
