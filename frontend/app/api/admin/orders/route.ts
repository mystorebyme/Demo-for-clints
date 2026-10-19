import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminAnalyticsSummary,
  getAdminConfig,
  getDeliveryConfig,
  getLiveProducts,
  getStoreProfile,
  listProductInquiries,
  listSentEmails,
  listServerCoupons,
  listServerOrders,
  verifyAdminTokenHeader,
} from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token');

  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized admin token' },
      { status: 401 }
    );
  }

  const orders = listServerOrders();
  const config = getAdminConfig();
  const analytics = getAdminAnalyticsSummary();
  const products = getLiveProducts();
  const coupons = listServerCoupons();
  const emails = listSentEmails();
  const storeProfile = getStoreProfile();
  const deliveryConfig = getDeliveryConfig();
  const inquiries = listProductInquiries();

  return NextResponse.json({
    success: true,
    orders,
    config,
    analytics,
    products,
    coupons,
    emails,
    storeProfile,
    deliveryConfig,
    inquiries,
  });
}
