import { NextRequest, NextResponse } from 'next/server';
import {
  createLiveProduct,
  getLiveProducts,
  updateLiveProduct,
  verifyAdminTokenHeader,
} from '../../../../lib/serverStore';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body?.name || String(body.name).trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Product name is required (at least 2 characters)' },
        { status: 400 }
      );
    }
    const created = createLiveProduct({
      name: String(body.name),
      name_hi: body.name_hi ? String(body.name_hi) : String(body.name),
      category: body.category || 'kurti',
      price_paise: Number(body.price_paise) || 79900,
      original_price_paise: body.original_price_paise ? Number(body.original_price_paise) : undefined,
      stock: Number(body.stock ?? 20),
      image_url: body.image_url || '/products/kurti1.svg',
      sizes: Array.isArray(body.sizes) ? body.sizes : undefined,
      badge: body.badge || 'New Arrival',
      badge_hi: body.badge_hi || 'नया कलेक्शन',
      description: body.description,
      description_hi: body.description_hi,
    });

    return NextResponse.json({
      success: true,
      product: created,
      products: getLiveProducts(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid product payload' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  if (!verifyAdminTokenHeader(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ success: false, error: 'Valid product ID is required' }, { status: 400 });
    }
    const updated = updateLiveProduct(id, {
      name: body.name,
      name_hi: body.name_hi,
      category: body.category,
      price_paise: body.price_paise !== undefined ? Number(body.price_paise) : undefined,
      original_price_paise:
        body.original_price_paise !== undefined ? Number(body.original_price_paise) : undefined,
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      image_url: body.image_url,
      badge: body.badge,
      badge_hi: body.badge_hi,
    });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      product: updated,
      products: getLiveProducts(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid update payload' }, { status: 400 });
  }
}
