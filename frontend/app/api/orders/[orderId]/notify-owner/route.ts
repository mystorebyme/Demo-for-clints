import { NextRequest, NextResponse } from 'next/server';
import {
  getServerOrder,
  notifyStoreOwnerOfOrder,
  verifyAccountSessionToken,
  verifyAdminTokenHeader,
  verifyOrderAccessToken,
} from '../../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
  const orderId = context.params.orderId;
  const order = getServerOrder(orderId);
  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }

  const orderToken = req.headers.get('x-order-token') || '';
  const accountToken = req.headers.get('x-account-token') || '';
  const isAdmin = verifyAdminTokenHeader(req.headers.get('x-admin-token'));

  const isOwner =
    verifyOrderAccessToken(orderToken, order.order_id) ||
    verifyAccountSessionToken(accountToken, order.customer_email).valid ||
    isAdmin;

  if (!isOwner) {
    return NextResponse.json(
      { success: false, error: 'Only the customer who placed this order can send it to the store owner.' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const dispatched = notifyStoreOwnerOfOrder(order.order_id, body?.note);

  return NextResponse.json({
    ...dispatched,
  });
}
