import { NextResponse } from 'next/server';
import { getServerOrder, tryProxyBackend } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { orderId: string } }) {
  const { orderId } = params;

  const upstream = await tryProxyBackend(`/api/orders/${encodeURIComponent(orderId)}`);
  if (upstream) {
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  }

  const order = getServerOrder(orderId);
  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
  }

  const remainingSeconds = Math.max(0, Math.floor((new Date(order.expires_at).getTime() - Date.now()) / 1000));

  return NextResponse.json({
    success: true,
    orderId: order.order_id,
    status: order.status,
    amountPaise: order.amount_paise,
    items: order.items,
    customerName: order.customer_name,
    trackingId: order.tracking_id,
    courierName: order.courier_name,
    fulfillmentStatus: order.fulfillment_status,
    estimatedDelivery: order.estimated_delivery,
    trackingHistory: order.tracking_history,
    createdAt: order.created_at,
    expiresAt: order.expires_at,
    confirmedAt: order.confirmed_at,
    remainingSeconds,
    qrPayload: order.qr_payload,
  });
}
