import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateOrRegisterAccount,
  getCustomerAccount,
  upsertCustomerAccount,
  validateAuthenticEmail,
  verifyAccountSessionToken,
} from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') || '').trim().toLowerCase();
  const token =
    req.headers.get('x-account-token') ||
    req.nextUrl.searchParams.get('token') ||
    '';

  const check = validateAuthenticEmail(email);
  if (!check.valid) {
    return NextResponse.json(
      {
        success: false,
        error: check.reason_en || 'Please provide a valid email address',
      },
      { status: 400 }
    );
  }

  // Strict authorization guard: nobody can read another customer's email profile/orders without a signed session token
  const verified = verifyAccountSessionToken(token, check.email);
  if (!verified.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Session authentication required. Please sign in with your account password.',
      },
      { status: 401 }
    );
  }

  const account = getCustomerAccount(check.email);
  if (!account) {
    return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    ...account,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || 'sync';
    const email = String(body?.email || '').trim().toLowerCase();

    if (action === 'login' || action === 'register') {
      const authResult = authenticateOrRegisterAccount({
        mode: action === 'register' ? 'register' : 'login',
        email,
        password: String(body?.password || ''),
        name: body?.name,
        phone: body?.phone,
      });

      if (!authResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: authResult.error,
            error_hi: authResult.error_hi,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(authResult);
    }

    // Profile / Wishlist Sync requires valid signed session token for that email
    const check = validateAuthenticEmail(email);
    if (!check.valid) {
      return NextResponse.json(
        {
          success: false,
          error: check.reason_en || 'Please enter a genuine email address',
        },
        { status: 400 }
      );
    }

    const token =
      req.headers.get('x-account-token') ||
      String(body?.sessionToken || '');
    const verified = verifyAccountSessionToken(token, check.email);
    if (!verified.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized account modification blocked. Please sign in with your password.',
        },
        { status: 401 }
      );
    }

    const updated = upsertCustomerAccount({
      email: check.email,
      name: body?.name,
      phone: body?.phone,
      pincode: body?.pincode,
      cityState: body?.cityState,
      address: body?.address,
      wishlist: body?.wishlist,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Could not update account' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...updated,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid account payload' },
      { status: 400 }
    );
  }
}
