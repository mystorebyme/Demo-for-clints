import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateOrRegisterAccount,
  getCustomerAccount,
  requestRegistrationOtp,
  signAccountSessionToken,
  upsertCustomerAccount,
  validateAuthenticEmail,
  verifyAccountSessionToken,
  verifyRegistrationOtpAndCreate,
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

  const verified = verifyAccountSessionToken(token, check.email);
  if (!verified.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Session authentication required. Please sign in with your verified account.',
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

    // 1. Official Google OAuth 2.0 ID Token Verification
    if (action === 'google_oauth') {
      const credential = String(body?.credential || '');
      if (!credential) {
        return NextResponse.json(
          { success: false, error: 'Missing Google OAuth credential token' },
          { status: 400 }
        );
      }

      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        if (!verifyRes.ok) {
          return NextResponse.json(
            { success: false, error: 'Google ID token verification failed' },
            { status: 401 }
          );
        }
        const tokenPayload = await verifyRes.json();
        if (
          tokenPayload.email_verified !== 'true' &&
          tokenPayload.email_verified !== true
        ) {
          return NextResponse.json(
            { success: false, error: 'Google account email is not verified' },
            { status: 401 }
          );
        }

        const googleEmail = String(tokenPayload.email || '').trim().toLowerCase();
        const updated = upsertCustomerAccount({
          email: googleEmail,
          name: tokenPayload.name || '',
        });

        return NextResponse.json({
          success: true,
          sessionToken: signAccountSessionToken(googleEmail),
          ...updated,
        });
      } catch {
        return NextResponse.json(
          { success: false, error: 'Could not verify Google OAuth token' },
          { status: 401 }
        );
      }
    }

    // 2. Step 1 of Verified Account Creation: Send 6-Digit OTP to Email (Never exposed in response)
    if (action === 'register_send_otp') {
      const otpRes = requestRegistrationOtp({
        email,
        password: String(body?.password || ''),
        name: String(body?.name || ''),
        phone: String(body?.phone || ''),
      });
      if (!otpRes.success) {
        return NextResponse.json(otpRes, { status: 400 });
      }
      return NextResponse.json(otpRes);
    }

    // 3. Step 2 of Verified Account Creation: Verify 6-Digit OTP from Email Inbox
    if (action === 'register_verify_otp') {
      const verifyRes = verifyRegistrationOtpAndCreate(email, String(body?.otp || ''));
      if (!verifyRes.success) {
        return NextResponse.json(verifyRes, { status: 401 });
      }
      return NextResponse.json(verifyRes);
    }

    // 4. Existing Verified Account Sign-In with Password
    if (action === 'login') {
      const authResult = authenticateOrRegisterAccount({
        mode: 'login',
        email,
        password: String(body?.password || ''),
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

    // 5. Profile / Wishlist Sync (requires valid signed session token)
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
