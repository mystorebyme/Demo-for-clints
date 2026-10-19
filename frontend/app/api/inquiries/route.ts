import { NextRequest, NextResponse } from 'next/server';
import {
  createProductInquiry,
  listProductInquiries,
  updateProductInquiryStatus,
  verifyAdminTokenHeader,
} from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminTokenHeader(req.headers.get('x-admin-token'))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    inquiries: listProductInquiries(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createProductInquiry({
      productId: Number(body?.productId),
      selectedSize: body?.selectedSize,
      customerName: body?.customerName || '',
      customerPhone: body?.customerPhone || '',
      customerEmail: body?.customerEmail || '',
      pincode: body?.pincode || '',
      message: body?.message || '',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to submit product inquiry' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!verifyAdminTokenHeader(req.headers.get('x-admin-token'))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const updated = updateProductInquiryStatus(
      String(body?.id || ''),
      body?.status || 'REPLIED',
      body?.adminNote
    );
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, inquiry: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update inquiry' }, { status: 400 });
  }
}
