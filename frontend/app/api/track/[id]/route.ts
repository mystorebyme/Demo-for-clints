import { NextRequest, NextResponse } from 'next/server';
import { findServerOrderByOrderOrTrackingId } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const id = (context.params.id || '').trim();
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Please provide a valid Tracking ID or Order ID' },
      { status: 400 }
    );
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/track/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (res.ok || res.status === 404) {
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
    } catch {
      // Fallback to local server store
    }
  }

  const order = findServerOrderByOrderOrTrackingId(id);
  if (!order) {
    return NextResponse.json(
      {
        success: false,
        error: `No order found matching "${id}". Try demo Tracking ID: TRK-KC-1001`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    orderId: order.order_id,
    trackingId: order.tracking_id,
    invoiceNumber: order.invoice_number,
    paymentStatus: order.status,
    fulfillmentStatus: order.fulfillment_status,
    courierName: order.courier_name,
    estimatedDelivery: order.estimated_delivery,
    trackingHistory: order.tracking_history || [],
    customerName: order.customer_name,
    phone: order.phone,
    address: order.address,
    subtotalPaise: order.subtotal_paise,
    discountPaise: order.discount_paise,
    couponCode: order.coupon_code,
    gstPaise: order.gst_paise,
    amountPaise: order.amount_paise,
    items: order.items,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  });
}
