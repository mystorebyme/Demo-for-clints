import { NextRequest, NextResponse } from 'next/server';
import { findServerOrderByOrderOrTrackingId } from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

function extractSafeRegionHub(rawAddress: string): string {
  const pinMatch = (rawAddress || '').match(/(\d{6})/);
  const maskedPin = pinMatch ? `PIN ${pinMatch[1].slice(0, 3)}***` : 'Regional Hub';
  if (/jaipur/i.test(rawAddress)) return `Jaipur Hub, Rajasthan (${maskedPin})`;
  if (/udaipur/i.test(rawAddress)) return `Udaipur Hub, Rajasthan (${maskedPin})`;
  if (/jodhpur/i.test(rawAddress)) return `Jodhpur Hub, Rajasthan (${maskedPin})`;
  if (/rajasthan/i.test(rawAddress)) return `Rajasthan Sorting Hub (${maskedPin})`;
  return `Destination Regional Hub (${maskedPin})`;
}

function scrubPiiFromNote(note: string): string {
  return String(note || '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[Protected Email]')
    .replace(/\b[6-9]\d{9}\b/g, '[Protected Phone]');
}

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const id = (context.params.id || '').trim().toUpperCase();
  if (!id || id.length < 6) {
    return NextResponse.json(
      {
        success: false,
        error: 'Please enter the 12-digit Tracking ID sent to your email (e.g. TRK-KC-...)',
      },
      { status: 400 }
    );
  }

  const isTrackingToken = id.startsWith('TRK-KC-');
  const phoneLast4 = (req.nextUrl.searchParams.get('phone') || '').replace(/\D/g, '').slice(-4);

  if (!isTrackingToken && id !== 'ORDDEMO1001' && phoneLast4.length !== 4) {
    return NextResponse.json(
      {
        success: false,
        error:
          'For your privacy, public tracking requires your Tracking ID (TRK-KC-...) sent to your email.',
      },
      { status: 403 }
    );
  }

  const order = findServerOrderByOrderOrTrackingId(id);
  if (!order) {
    return NextResponse.json(
      {
        success: false,
        error: 'No shipment found matching this Tracking ID. Please check your email receipt.',
      },
      { status: 404 }
    );
  }

  if (!isTrackingToken && id !== 'ORDDEMO1001' && !order.phone.endsWith(phoneLast4)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Verification did not match this shipment.',
      },
      { status: 403 }
    );
  }

  // Strictly NO personal details (no name, no phone, no email, no street address) exposed on public tracking
  return NextResponse.json({
    success: true,
    orderId: order.order_id,
    trackingId: order.tracking_id,
    paymentStatus: order.status,
    fulfillmentStatus: order.fulfillment_status,
    courierName: order.courier_name,
    estimatedDelivery: order.estimated_delivery,
    destinationHub: extractSafeRegionHub(order.address),
    trackingHistory: (order.tracking_history || []).map((ev) => ({
      ...ev,
      note: scrubPiiFromNote(ev.note),
    })),
    items: (order.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      size: item.size,
    })),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  });
}
