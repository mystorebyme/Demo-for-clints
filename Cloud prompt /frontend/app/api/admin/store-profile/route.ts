import { NextRequest, NextResponse } from 'next/server';
import {
  getStoreProfile,
  updateStoreProfile,
  verifyAdminTokenHeader,
} from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    storeProfile: getStoreProfile(),
  });
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = updateStoreProfile(body || {});
    return NextResponse.json({
      success: true,
      storeProfile: updated,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid store profile payload' }, { status: 400 });
  }
}
