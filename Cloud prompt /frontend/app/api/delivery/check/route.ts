import { NextRequest, NextResponse } from 'next/server';
import { checkPincodeServiceability, getDeliveryConfig } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get('pincode') || req.nextUrl.searchParams.get('pin') || '';
  const address = req.nextUrl.searchParams.get('address') || undefined;
  const result = checkPincodeServiceability(pincode, address);
  const config = getDeliveryConfig();

  return NextResponse.json(
    {
      success: result.valid && result.serviceable,
      ...result,
      deliveryMode: config.mode,
    },
    { status: result.valid ? 200 : 400 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = checkPincodeServiceability(body?.pincode || '', body?.address);
    return NextResponse.json(
      {
        success: result.valid && result.serviceable,
        ...result,
      },
      { status: result.valid ? 200 : 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, valid: false, serviceable: false, message_en: 'Invalid request' },
      { status: 400 }
    );
  }
}
