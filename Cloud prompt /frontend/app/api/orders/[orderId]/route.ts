import { NextRequest, NextResponse } from 'next/server';
import {
  dispatchOrderConfirmationEmail,
  getOrderEmailReceipt,
  getServerOrder,
  getStoreProfile,
} from '../../../../lib/serverStore';

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

  const emailReceipt = getOrderEmailReceipt(order.order_id);
  const storeProfile = getStoreProfile();

  return NextResponse.json({
    success: true,
    orderId: order.order_id,
    status: order.status,
    subtotalPaise: order.subtotal_paise,
    discountPaise: order.discount_paise,
    shippingPaise: order.shipping_paise,
    couponCode: order.coupon_code,
    taxablePaise: order.taxable_paise,
    cgstPaise: order.cgst_paise,
    sgstPaise: order.sgst_paise,
    igstPaise: order.igst_paise,
    gstPaise: order.gst_paise,
    supplyType: order.supply_type,
    amountPaise: order.amount_paise,
    invoiceNumber: order.invoice_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    phone: order.phone,
    address: order.address,
    items: order.items,
    trackingId: order.tracking_id,
    courierName: order.courier_name,
    fulfillmentStatus: order.fulfillment_status,
    estimatedDelivery: order.estimated_delivery,
    trackingHistory: order.tracking_history || [],
    emailSent: order.email_sent,
    emailSentAt: order.email_sent_at,
    emailReceipt,
    storeProfile,
    qrExpiresAt: order.qr_expires_at,
    qrPayload: order.qr_payload,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    paymentId: order.payment_id || null,
  });
}

// POST /api/orders/[orderId] -> Resend Order Confirmation + GST Invoice + Tracking Email
export async function POST(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
  const orderId = context.params.orderId;
  const order = getServerOrder(orderId);
  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(body.email).trim())) {
      order.customer_email = String(body.email).trim().toLowerCase();
    }
    const emailReceipt = dispatchOrderConfirmationEmail(order);
    return NextResponse.json({
      success: true,
      emailSentTo: order.customer_email,
      emailReceipt,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Could not resend email' }, { status: 400 });
  }
}
