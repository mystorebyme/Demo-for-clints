import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomerAccount,
  requestEmailVerificationOtp,
  upsertCustomerAccount,
  validateAuthenticEmail,
  verifyEmailWithOtp,
} from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email') || '';
    const check = validateAuthenticEmail(email);
    if (!check.valid) {
      return NextResponse.json(
        { error: check.reason_en, error_hi: check.reason_hi },
        { status: 400 }
      );
    }
    const data = getCustomerAccount(check.email);
    if (!data) {
      return NextResponse.json(
        { error: 'Please provide a valid personal or corporate email address.' },
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
    const action = body?.action;

    if (action === 'send_otp') {
      const otpRes = requestEmailVerificationOtp(body?.email || '');
      if (!otpRes.success) {
        return NextResponse.json(
          { error: otpRes.error, error_hi: otpRes.error_hi },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        email: otpRes.email,
        otpPreview: otpRes.otpPreview,
        message: `6-digit verification code sent to ${otpRes.email}`,
      });
    }

    if (action === 'verify_otp') {
      const verRes = verifyEmailWithOtp(body?.email || '', body?.otp || '');
      if (!verRes.success) {
        return NextResponse.json({ error: verRes.error }, { status: 400 });
      }
      return NextResponse.json(verRes);
    }

    const check = validateAuthenticEmail(body?.email || '');
    if (!check.valid) {
      return NextResponse.json(
        { error: check.reason_en, error_hi: check.reason_hi },
        { status: 400 }
      );
    }

    const data = upsertCustomerAccount({
      email: check.email,
      name: body?.name,
      phone: body?.phone,
      pincode: body?.pincode,
      cityState: body?.cityState,
      address: body?.address,
      wishlist: Array.isArray(body?.wishlist) ? body.wishlist : undefined,
    });

    if (!data) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
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
