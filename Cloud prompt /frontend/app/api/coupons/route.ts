import { NextRequest, NextResponse } from 'next/server';
import {
  listServerCoupons,
  validateCouponServerSide,
  verifyAdminTokenHeader,
} from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = verifyAdminTokenHeader(req.headers.get('x-admin-token'));
  // Promo codes are private and never exposed publicly to visitors on GET /api/coupons
  if (!isAdmin) {
    return NextResponse.json({
      success: true,
      coupons: [],
      terms: [
        'Each promo code is valid for 1 single use per customer account (verified by email and mobile number).',
        'New-patron welcome promo codes apply strictly on the first order only.',
        'Minimum cart value and maximum discount caps apply as per voucher terms.',
      ],
    });
  }

  const coupons = listServerCoupons();
  return NextResponse.json({
    success: true,
    coupons,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subtotalPaise = Number(body?.subtotalPaise) || 0;
    const result = validateCouponServerSide(body?.code, subtotalPaise, {
      email: body?.email || null,
      phone: body?.phone || null,
    });
    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Invalid or ineligible promo code',
        },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      code: result.code,
      discountPaise: result.discountPaise,
      message: result.message,
      terms_en: result.coupon?.terms_en,
      terms_hi: result.coupon?.terms_hi,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid coupon request' }, { status: 400 });
  }
}
