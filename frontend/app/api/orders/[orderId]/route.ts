import { NextRequest, NextResponse } from 'next/server';
import { getServerOrder } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: { orderId: string } }
) {
  const orderId = context.params.orderId;
  const backendUrl = process.env.BACKEND_INTERNAL_URL;

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/orders/${encodeURIComponent(orderId)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to local server store
    }
  }

  const order = getServerOrder(orderId);
  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    orderId: order.order_id,
    status: order.status,
    subtotalPaise: order.subtotal_paise,
    discountPaise: order.discount_paise,
    couponCode: order.coupon_code,
    gstPaise: order.gst_paise,
    amountPaise: order.amount_paise,
    invoiceNumber: order.invoice_number,
    customerName: order.customer_name,
    phone: order.phone,
    address: order.address,
    items: order.items,
    trackingId: order.tracking_id,
    courierName: order.courier_name,
    fulfillmentStatus: order.fulfillment_status,
    estimatedDelivery: order.estimated_delivery,
    trackingHistory: order.tracking_history || [],
    qrExpiresAt: order.qr_expires_at,
    qrPayload: order.qr_payload,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    paymentId: order.payment_id || null,
  });
}
