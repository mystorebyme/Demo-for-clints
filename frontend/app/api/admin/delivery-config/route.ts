import { NextRequest, NextResponse } from 'next/server';
import {
  getDeliveryConfig,
  updateDeliveryConfig,
  verifyAdminTokenHeader,
} from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminTokenHeader(req.headers.get('x-admin-token'))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    deliveryConfig: getDeliveryConfig(),
  });
}

export async function PUT(req: NextRequest) {
  if (!verifyAdminTokenHeader(req.headers.get('x-admin-token'))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const updated = updateDeliveryConfig(body || {});
    return NextResponse.json({
      success: true,
      deliveryConfig: updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update delivery configuration' },
      { status: 400 }
    );
  }
}
