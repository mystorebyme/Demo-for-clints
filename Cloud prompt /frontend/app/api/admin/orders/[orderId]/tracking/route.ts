import { NextRequest, NextResponse } from 'next/server';
import {
  FulfillmentStatus,
  updateServerOrderTracking,
  verifyAdminTokenHeader,
} from '../../../../../../lib/serverStore';

const ALLOWED_STAGES: FulfillmentStatus[] = [
  'PENDING_PAYMENT',
  'ORDER_PLACED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export async function PUT(
  req: NextRequest,
  context: { params: { orderId: string } }
) {
  const token = req.headers.get('x-admin-token');
  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin token' }, { status: 401 });
  }

  const orderId = context.params.orderId;
  try {
    const body = await req.json();
    const fulfillmentStatus = body?.fulfillmentStatus as FulfillmentStatus;
    if (!ALLOWED_STAGES.includes(fulfillmentStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid fulfillment status stage' },
        { status: 400 }
      );
    }

    const updated = updateServerOrderTracking(orderId, {
      fulfillmentStatus,
      courierName: body?.courierName,
      trackingId: body?.trackingId,
      estimatedDelivery: body?.estimatedDelivery,
      location: body?.location,
      note: body?.note,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: updated.order_id,
        trackingId: updated.tracking_id,
        courierName: updated.courier_name,
        fulfillmentStatus: updated.fulfillment_status,
        estimatedDelivery: updated.estimated_delivery,
        trackingHistory: updated.tracking_history,
        updatedAt: updated.updated_at,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
  }
}
