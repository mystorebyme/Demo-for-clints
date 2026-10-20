import { NextRequest, NextResponse } from 'next/server';
import {
  getDeliveryConfig,
  getServerOrder,
  getStoreProfile,
  verifyAccountSessionToken,
  verifyAdminTokenHeader,
  verifyOrderAccessToken,
} from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
  const orderId = context.params.orderId;
  const order = getServerOrder(orderId);
  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }

  const orderToken =
    req.headers.get('x-order-token') ||
    req.nextUrl.searchParams.get('orderToken') ||
    '';
  const accountToken =
    req.headers.get('x-account-token') ||
    req.nextUrl.searchParams.get('accountToken') ||
    '';
  const isAdmin = verifyAdminTokenHeader(req.headers.get('x-admin-token'));

  const hasValidOrderToken = verifyOrderAccessToken(orderToken, order.order_id);
  const accountCheck = verifyAccountSessionToken(accountToken, order.customer_email);
  const isAuthorizedOwner = Boolean(hasValidOrderToken || accountCheck.valid || isAdmin);

  const storeProfile = getStoreProfile();
  const deliveryConfig = getDeliveryConfig();

  return NextResponse.json({
    success: true,
    authorizedOwner: isAuthorizedOwner,
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
    // Strictly protect personal details from unauthenticated visitors
    customerName: isAuthorizedOwner ? order.customer_name : undefined,
    customerEmail: isAuthorizedOwner ? order.customer_email : undefined,
    phone: isAuthorizedOwner ? order.phone : undefined,
    address: isAuthorizedOwner ? order.address : undefined,
    items: order.items,
    trackingId: order.tracking_id,
    courierName: order.courier_name,
    fulfillmentStatus: order.fulfillment_status,
    estimatedDelivery: order.estimated_delivery,
    trackingHistory: order.tracking_history || [],
    emailSent: order.email_sent,
    emailSentAt: order.email_sent_at,
    ownerEmail: isAuthorizedOwner ? deliveryConfig.ownerEmail : undefined,
    ownerWhatsApp: isAuthorizedOwner ? deliveryConfig.ownerWhatsApp : undefined,
    storeProfile,
    qrExpiresAt: isAuthorizedOwner ? order.qr_expires_at : undefined,
    qrPayload: isAuthorizedOwner ? order.qr_payload : undefined,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    paymentId: order.payment_id || null,
  });
}
