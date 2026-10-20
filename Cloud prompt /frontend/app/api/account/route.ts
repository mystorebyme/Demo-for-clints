import { NextResponse } from 'next/server';
import {
  authenticateOrRegisterAccount,
  changeAccountPassword,
  getCustomerAccount,
  getPendingOtpNotification,
  requestLoginOtp,
  requestPasswordResetOtp,
  requestRegistrationOtp,
  signAccountSessionToken,
  upsertCustomerAccount,
  validateAuthenticEmail,
  verifyAccountSessionToken,
  verifyLoginOtp,
  verifyPasswordResetOtpAndSetPassword,
  verifyRegistrationOtpAndCreate,
} from '@/lib/serverStore';

/**
 * Verify a Google Identity Services ID token against Google's official tokeninfo endpoint.
 */
async function verifyGoogleIdToken(idToken: string): Promise<{
  valid: boolean;
  email?: string;
  name?: string;
  error?: string;
}> {
  if (!idToken || typeof idToken !== 'string' || idToken.length < 40) {
    return { valid: false, error: 'Invalid Google credential token.' };
  }
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      return { valid: false, error: 'Google token verification failed.' };
    }
    const payload = await res.json();
    if (!payload.email || payload.email_verified !== 'true') {
      return { valid: false, error: 'Google account email is not verified.' };
    }
    return {
      valid: true,
      email: String(payload.email).toLowerCase(),
      name: String(payload.name || payload.given_name || ''),
    };
  } catch {
    return {
      valid: false,
      error: 'Unable to reach Google Identity verification endpoint from this network. Please use Email & Password or Email OTP verification.',
    };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || '';

  const check = validateAuthenticEmail(email);
  if (!check.valid) {
    return NextResponse.json(
      { error: check.reason_en || 'Invalid email address', error_hi: check.reason_hi },
      { status: 400 }
    );
  }

  // Strictly require a valid HMAC-signed session token so nobody can read another person's account via URL!
  const sessionToken = req.headers.get('x-account-token');
  const verified = verifyAccountSessionToken(sessionToken, check.email);
  if (!verified.valid) {
    return NextResponse.json(
      {
        error: 'Session verification required. Please sign in with your password or 6-digit Email OTP.',
        error_hi: 'सत्र सत्यापन आवश्यक है। कृपया अपने पासवर्ड या ईमेल OTP से साइन इन करें।',
        requiresPassword: true,
      },
      { status: 401 }
    );
  }

  const data = getCustomerAccount(check.email);
  if (!data) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action || 'save';

    // 1. Official Google Sign-In Verification (OAuth2 ID Token)
    if (action === 'google_oauth') {
      const verifiedGoogle = await verifyGoogleIdToken(body?.credential || '');
      if (!verifiedGoogle.valid || !verifiedGoogle.email) {
        return NextResponse.json(
          { error: verifiedGoogle.error || 'Google verification failed' },
          { status: 401 }
        );
      }
      const updated = upsertCustomerAccount({
        email: verifiedGoogle.email,
        name: verifiedGoogle.name,
      });
      return NextResponse.json({
        success: true,
        sessionToken: signAccountSessionToken(verifiedGoogle.email),
        ...updated,
      });
    }

    // 2. Step 1 of Verified Registration: Send 6-Digit OTP to Email
    if (action === 'register_send_otp') {
      const otpRes = requestRegistrationOtp({
        email: body?.email || '',
        password: body?.password || '',
        name: body?.name || '',
        phone: body?.phone || '',
      });
      if (!otpRes.success) {
        return NextResponse.json(
          { error: otpRes.error, error_hi: otpRes.error_hi },
          { status: 400 }
        );
      }
      return NextResponse.json({
        ...otpRes,
        mailNotification: getPendingOtpNotification(otpRes.email),
      });
    }

    // 3. Step 2 of Verified Registration: Verify 6-Digit OTP & Create Account
    if (action === 'register_verify_otp') {
      const verifyRes = verifyRegistrationOtpAndCreate(body?.email || '', body?.otp || '');
      if (!verifyRes.success) {
        return NextResponse.json(
          { error: verifyRes.error, error_hi: verifyRes.error_hi },
          { status: 401 }
        );
      }
      return NextResponse.json(verifyRes);
    }

    // 4. Sign In with Email + Password
    if (action === 'login') {
      const authRes = authenticateOrRegisterAccount({
        mode: 'login',
        email: body?.email || '',
        password: body?.password || '',
      });
      if (!authRes.success) {
        return NextResponse.json(
          { error: authRes.error, error_hi: authRes.error_hi },
          { status: 401 }
        );
      }
      return NextResponse.json(authRes);
    }

    // 5. Amazon / Flipkart Passwordless Sign-In via 6-Digit Email OTP (Step 1: Send OTP)
    if (action === 'login_send_otp') {
      const otpRes = requestLoginOtp(body?.email || '');
      if (!otpRes.success) {
        return NextResponse.json(
          { error: otpRes.error, error_hi: otpRes.error_hi },
          { status: 400 }
        );
      }
      return NextResponse.json({
        ...otpRes,
        mailNotification: getPendingOtpNotification(otpRes.email),
      });
    }

    // 6. Amazon / Flipkart Passwordless Sign-In via 6-Digit Email OTP (Step 2: Verify OTP)
    if (action === 'login_verify_otp') {
      const verifyRes = verifyLoginOtp(body?.email || '', body?.otp || '');
      if (!verifyRes.success) {
        return NextResponse.json(
          { error: verifyRes.error, error_hi: verifyRes.error_hi },
          { status: 401 }
        );
      }
      return NextResponse.json(verifyRes);
    }

    // 7. Forgot Password / Reset Password via 6-Digit Email OTP (Step 1: Send Reset OTP)
    if (action === 'forgot_send_otp') {
      const otpRes = requestPasswordResetOtp(body?.email || '');
      if (!otpRes.success) {
        return NextResponse.json(
          { error: otpRes.error, error_hi: otpRes.error_hi },
          { status: 400 }
        );
      }
      return NextResponse.json({
        ...otpRes,
        mailNotification: getPendingOtpNotification(otpRes.email),
      });
    }

    // 8. Forgot Password / Reset Password via 6-Digit Email OTP (Step 2: Verify OTP & Set New Password)
    if (action === 'forgot_verify_reset') {
      const resetRes = verifyPasswordResetOtpAndSetPassword({
        email: body?.email || '',
        otp: body?.otp || '',
        newPassword: body?.newPassword || '',
      });
      if (!resetRes.success) {
        return NextResponse.json(
          { error: resetRes.error, error_hi: resetRes.error_hi },
          { status: 400 }
        );
      }
      return NextResponse.json(resetRes);
    }

    // Direct 'register' without OTP is blocked for security
    if (action === 'register') {
      return NextResponse.json(
        {
          error:
            'Unverified account creation is disabled. Please request a 6-digit Email OTP (register_send_otp) and verify it first.',
          error_hi:
            'बिना वेरिफिकेशन के अकाउंट बनाना बंद है। कृपया पहले 6-अंकों का ईमेल OTP मंगाएं और सत्यापित करें।',
        },
        { status: 403 }
      );
    }

    const check = validateAuthenticEmail(body?.email || '');
    if (!check.valid) {
      return NextResponse.json(
        { error: check.reason_en || 'Invalid email address', error_hi: check.reason_hi },
        { status: 400 }
      );
    }

    // Require valid session token for any profile mutation (save profile, wishlist sync, address book, password change)
    const sessionToken = req.headers.get('x-account-token') || body?.sessionToken;
    const verified = verifyAccountSessionToken(sessionToken, check.email);
    if (!verified.valid) {
      return NextResponse.json(
        {
          error: 'Unauthorized profile update. Please sign in first.',
          error_hi: 'अनधिकृत प्रोफ़ाइल अपडेट। कृपया पहले साइन इन करें।',
        },
        { status: 401 }
      );
    }

    // 9. Change Password while logged in
    if (action === 'change_password') {
      const pwdRes = changeAccountPassword({
        email: check.email,
        currentPassword: body?.currentPassword,
        newPassword: body?.newPassword || '',
      });
      if (!pwdRes.success) {
        return NextResponse.json(
          { error: pwdRes.error, error_hi: pwdRes.error_hi },
          { status: 400 }
        );
      }
      return NextResponse.json(pwdRes);
    }

    // 10. Save Profile / Sync Wishlist / Save Address Book
    const updated = upsertCustomerAccount({
      email: check.email,
      name: body?.name,
      phone: body?.phone,
      pincode: body?.pincode,
      cityState: body?.cityState,
      address: body?.address,
      wishlist: body?.wishlist,
      savedAddresses: body?.savedAddresses,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
