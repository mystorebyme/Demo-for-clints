import { NextRequest, NextResponse } from 'next/server';
import { setNotificationTarget, verifyAdminTokenHeader } from '../../../../lib/serverStore';

export async function PUT(req: NextRequest) {
  const token = req.headers.get('x-admin-token');

  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body?.target || typeof body.target !== 'string' || body.target.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Valid notification target is required' },
        { status: 400 }
      );
    }

    const updated = setNotificationTarget(body.target);
    return NextResponse.json({
      success: true,
      notificationTarget: updated,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
