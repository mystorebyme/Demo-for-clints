import { NextRequest, NextResponse } from 'next/server';
import { listServerCoupons, validateCouponServerSide } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const coupons = listServerCoupons().filter((c) => c.active);
  return NextResponse.json({
    success: true,
    coupons,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subtotalPaise = Number(body?.subtotalPaise) || 0;
    const result = validateCouponServerSide(body?.code, subtotalPaise);
    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Invalid coupon code',
        },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      code: result.code,
      discountPaise: result.discountPaise,
      message: result.message,
      coupon: result.coupon,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid coupon request' }, { status: 400 });
  }
}
