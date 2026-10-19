import { NextResponse } from 'next/server';
import {
  getAdminStoreData,
  setAdminNotificationTarget,
  tryProxyBackend,
  verifyAdminTokenHeader,
} from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = req.headers.get('x-admin-token');

  const upstream = await tryProxyBackend('/api/admin/notification-target', {
    headers: { 'x-admin-token': token || '' },
  });
  if (upstream) {
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  }

  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { target } = getAdminStoreData();
  return NextResponse.json({ success: true, target });
}

export async function PUT(req: Request) {
  const token = req.headers.get('x-admin-token');
  const body = await req.json().catch(() => ({}));

  const upstream = await tryProxyBackend('/api/admin/notification-target', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token || '',
    },
    body: JSON.stringify(body),
  });
  if (upstream) {
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  }

  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const target = String(body.target || '').trim();
  if (target.length < 3 || target.length > 100) {
    return NextResponse.json({ success: false, error: 'Target must be 3–100 characters.' }, { status: 400 });
  }

  setAdminNotificationTarget(target);
  return NextResponse.json({ success: true, testMessageSent: Boolean(process.env.TELEGRAM_BOT_TOKEN) });
}
