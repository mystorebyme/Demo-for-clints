import { NextRequest, NextResponse } from 'next/server';
import { createServerOrder } from '../../../lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey =
      req.headers.get('x-idempotency-key') || body?.idempotencyKey || null;

    const backendUrl = process.env.BACKEND_INTERNAL_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {}),
          },
          body: JSON.stringify(body),
          cache: 'no-store',
        });
        if (res.ok || res.status === 400 || res.status === 409 || res.status === 422) {
          const data = await res.json();
          return NextResponse.json(data, { status: res.status });
        }
      } catch {
        // Fallback to local server store
      }
    }

    const created = createServerOrder({
      customer: body?.customer || {},
      items: body?.items || [],
      couponCode: body?.couponCode || null,
      idempotencyKey,
    });

    if (!created.success) {
      return NextResponse.json({ success: false, error: created.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      orderId: created.orderId,
      amountPaise: created.amountPaise,
      subtotalPaise: created.subtotalPaise,
      discountPaise: created.discountPaise,
      couponCode: created.couponCode,
      invoiceNumber: created.invoiceNumber,
      expiresInSeconds: created.expiresInSeconds,
      qrPayload: created.qrPayload,
      demoMode: true,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to process order request' },
      { status: 400 }
    );
  }
}
