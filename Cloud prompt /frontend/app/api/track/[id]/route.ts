import { NextRequest, NextResponse } from 'next/server';
import {
  findServerOrderByOrderOrTrackingId,
  maskEmail,
  maskPhone,
} from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const id = (context.params.id || '').trim().toUpperCase();
  if (!id || id.length < 6) {
    return NextResponse.json(
      {
        success: false,
        error: 'Please enter the confidential Tracking ID sent to your email (e.g. TRK-KC-...)',
      },
      { status: 400 }
    );
  }

  // Anti-enumeration guard: unless it's a confidential TRK-KC-... token or the showcase seed ORDDEMO1001,
  // require phone last-4 verification query param (?phoneLast4=XXXX) when searching by raw Order ID.
  const isTrackingToken = id.startsWith('TRK-KC-');
  const phoneLast4 = (req.nextUrl.searchParams.get('phone') || '').replace(/\D/g, '').slice(-4);

  if (!isTrackingToken && id !== 'ORDDEMO1001' && phoneLast4.length !== 4) {
    return NextResponse.json(
      {
        success: false,
        error:
          'For your privacy, public tracking requires your confidential Tracking ID (TRK-KC-...) sent to your email.',
      },
      { status: 403 }
    );
  }

  const order = findServerOrderByOrderOrTrackingId(id);
  if (!order) {
    return NextResponse.json(
      {
        success: false,
        error: 'No shipment found matching this confidential Tracking ID. Please check your email receipt.',
      },
      { status: 404 }
    );
  }

  if (!isTrackingToken && id !== 'ORDDEMO1001' && !order.phone.endsWith(phoneLast4)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Phone verification did not match this order.',
      },
      { status: 403 }
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
    // Mask sensitive PII on public tracking endpoint to prevent data leaks
    customerEmail: maskEmail(order.customer_email),
    phone: maskPhone(order.phone),
    address: order.address,
    subtotalPaise: order.subtotal_paise,
    discountPaise: order.discount_paise,
    shippingPaise: order.shipping_paise,
    couponCode: order.coupon_code,
    gstPaise: order.gst_paise,
    amountPaise: order.amount_paise,
    items: order.items,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  });
}
