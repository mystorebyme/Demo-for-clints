import { NextRequest, NextResponse } from 'next/server';
import { getCustomerAccount, upsertCustomerAccount } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email') || '';
    const data = getCustomerAccount(email);
    if (!data) {
      return NextResponse.json(
        { error: 'Please provide a valid email address (e.g. yourname@gmail.com)' },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load customer account right now.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = upsertCustomerAccount({
      email: body?.email || '',
      name: body?.name,
      phone: body?.phone,
      pincode: body?.pincode,
      cityState: body?.cityState,
      address: body?.address,
      wishlist: Array.isArray(body?.wishlist) ? body.wishlist : undefined,
    });

    if (!data) {
      return NextResponse.json(
        { error: 'Please enter a valid Gmail or email address.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to sync account details right now.' },
      { status: 500 }
    );
  }
}
