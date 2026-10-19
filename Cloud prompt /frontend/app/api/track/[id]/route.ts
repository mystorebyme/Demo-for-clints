import { NextResponse } from 'next/server';
import { findServerOrderByOrderOrTrackingId, tryProxyBackend } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id || '').trim();
  if (!id || id.length < 4) {
    return NextResponse.json(
      { success: false, error: 'Please provide a valid Tracking ID or Order ID.' },
      { status: 400 }
    );
  }

  const upstream = await tryProxyBackend(`/api/track/${encodeURIComponent(id)}`);
  if (upstream) {
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  }

  const order = findServerOrderByOrderOrTrackingId(id);
  if (!order) {
    return NextResponse.json(
      { success: false, error: 'No order found with this Tracking ID or Order ID.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    orderId: order.order_id,
    trackingId: order.tracking_id,
    paymentStatus: order.status,
    fulfillmentStatus: order.fulfillment_status,
    courierName: order.courier_name,
    estimatedDelivery: order.estimated_delivery,
    trackingHistory: order.tracking_history,
    customerName: order.customer_name,
    address: order.address,
    amountPaise: order.amount_paise,
    items: order.items,
    createdAt: order.created_at,
    confirmedAt: order.confirmed_at,
  });
}
