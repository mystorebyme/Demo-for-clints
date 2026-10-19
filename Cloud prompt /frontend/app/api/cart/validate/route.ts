import { NextResponse } from 'next/server';
import { validateCartServerSide } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    const result = validateCartServerSide(items);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid cart payload.' }, { status: 400 });
  }
}
