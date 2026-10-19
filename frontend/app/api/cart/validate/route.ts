import { NextRequest, NextResponse } from 'next/server';
import { validateCartServerSide } from '../../../../lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_INTERNAL_URL;

    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/cart/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store',
        });
        if (res.ok || res.status === 400 || res.status === 409) {
          const data = await res.json();
          return NextResponse.json(data, { status: res.status });
        }
      } catch {
        // Fallback to local authoritative validator
      }
    }

    const result = validateCartServerSide(body?.items || [], body?.couponCode || null, {
      email: body?.email || null,
      phone: body?.phone || null,
    });
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid cart validation payload' },
      { status: 400 }
    );
  }
}
