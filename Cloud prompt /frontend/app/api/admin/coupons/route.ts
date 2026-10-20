import { NextRequest, NextResponse } from 'next/server';
import {
  listServerCoupons,
  toggleServerCoupon,
  upsertServerCoupon,
  verifyAdminTokenHeader,
} from '../../../../lib/serverStore';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (body?.action === 'toggle' && body?.code) {
      const toggled = toggleServerCoupon(String(body.code));
      if (!toggled) {
        return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        coupon: toggled,
        coupons: listServerCoupons(),
      });
    }

    if (!body?.code || String(body.code).trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Coupon code must be at least 3 characters' },
        { status: 400 }
      );
    }

    const coupon = upsertServerCoupon({
      code: String(body.code),
      description_en: body.description_en || `${body.code} Special Discount`,
      description_hi: body.description_hi || body.description_en || `${body.code} विशेष छूट`,
      discount_type: body.discount_type === 'FLAT' ? 'FLAT' : 'PERCENT',
      discount_value: Number(body.discount_value) || 10,
      min_order_paise: Number(body.min_order_paise) || 0,
      max_discount_paise: Number(body.max_discount_paise) || 100000,
      active: true,
    });

    return NextResponse.json({
      success: true,
      coupon,
      coupons: listServerCoupons(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid coupon payload' }, { status: 400 });
  }
}
