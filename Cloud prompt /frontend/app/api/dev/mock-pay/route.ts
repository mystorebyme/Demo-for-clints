import { NextRequest, NextResponse } from 'next/server';
import { confirmServerOrder, getServerOrder } from '../../../../lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body?.orderId;
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    const order = getServerOrder(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const confirmRes = confirmServerOrder(orderId, {
      id: `pay_mock_${Date.now()}`,
      amount: order.amount_paise,
      method: 'upi_qr_simulated',
    });

    return NextResponse.json({
      success: true,
      result: confirmRes.result,
      trackingId: confirmRes.trackingId || null,
      orderId,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Simulation failed' }, { status: 400 });
  }
}
