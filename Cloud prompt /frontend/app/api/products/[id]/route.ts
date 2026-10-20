import { NextRequest, NextResponse } from 'next/server';
import { enrichProduct } from '../../../../lib/catalog';
import {
  addProductReview,
  getLiveProductById,
  getProductReviews,
} from '../../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/products/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          return NextResponse.json({
            success: true,
            demo: true,
            product: enrichProduct(data.product),
            reviews: getProductReviews(id),
          });
        }
      }
    } catch {
      // Fallback to live store
    }
  }

  const product = getLiveProductById(id);
  if (!product) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    demo: true,
    product,
    reviews: getProductReviews(id),
  });
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    if (!body?.customer_name || body.customer_name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Please enter your name' }, { status: 400 });
    }
    if (!body?.comment || body.comment.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'Please write a short review' }, { status: 400 });
    }
    const review = addProductReview(id, {
      customer_name: body.customer_name,
      city: body.city || 'India',
      rating: Number(body.rating) || 5,
      comment: body.comment,
    });
    return NextResponse.json({
      success: true,
      review,
      reviews: getProductReviews(id),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid review payload' }, { status: 400 });
  }
}
