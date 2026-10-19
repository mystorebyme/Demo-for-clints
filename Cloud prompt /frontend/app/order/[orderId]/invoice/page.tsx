'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { rupees, rupeesInWords } from '../../../../lib/store';

type StoreProfileData = {
  storeName: string;
  legalName: string;
  gstin: string;
  pan: string;
  stateName: string;
  stateCode: string;
  address: string;
  supportEmail: string;
  supportPhone: string;
  invoicePrefix: string;
  freeShippingThresholdPaise: number;
  shippingChargePaise: number;
  gstRatePercent: number;
  signatoryName: string;
};

type InvoiceOrder = {
  orderId: string;
  invoiceNumber: string;
  createdAt: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  couponCode: string | null;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  gstPaise: number;
  supplyType: 'INTRA_STATE' | 'INTER_STATE';
  amountPaise: number;
  status: string;
  paymentId?: string | null;
  trackingId?: string | null;
  courierName?: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  address: string;
  items: {
    id: number;
    name: string;
    qty: number;
    size: string;
    price_paise: number;
    hsn_code?: string;
  }[];
  storeProfile?: StoreProfileData;
};

export default function InvoicePage({ params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const [order, setOrder] = useState<InvoiceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.orderId) {
          setOrder(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 text-stone-600 text-sm">
        Generating official GST Tax Invoice...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 p-6 text-center">
        <h1 className="text-xl font-bold text-stone-900 mb-2">Invoice Not Found</h1>
        <Link href="/" className="px-4 py-2 rounded-xl bg-rose-900 text-white text-xs font-bold">
          Return to Store
        </Link>
      </div>
    );
  }

  const sp: StoreProfileData = order.storeProfile || {
    storeName: 'ZARIYA JAIPUR — ROYAL ETHNIC HOUSE',
    legalName: 'Zariya Heritage Apparels Pvt. Ltd.',
    gstin: '08AABCZ9481K1Z4',
    pan: 'AABCZ9481K',
    stateName: 'Rajasthan',
    stateCode: '08',
    address: 'Plot 14, Johari Bazar Heritage Arcade, Near Hawa Mahal, Jaipur, Rajasthan - 302002',
    supportEmail: 'concierge@zariyajaipur.in',
    supportPhone: '+91-98765-43210',
    invoicePrefix: 'INV-KC-2026',
    freeShippingThresholdPaise: 99900,
    shippingChargePaise: 7900,
    gstRatePercent: 5,
    signatoryName: 'Authorized Signatory — Zariya Heritage Apparels Pvt. Ltd.',
  };

  const isIntra = order.supplyType !== 'INTER_STATE';
  const gstRate = sp.gstRatePercent || 5;
  const halfRate = (gstRate / 2).toFixed(1);
  const shippingPaise = order.shippingPaise || 0;

  return (
    <div className="min-h-screen bg-stone-200 py-6 sm:py-10 px-4 print:bg-white print:p-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href={`/order/${order.orderId}`}
            className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-bold shadow-sm transition"
          >
            ← Back to Order #{order.orderId}
          </Link>
          {order.trackingId && (
            <Link
              href={`/track?id=${encodeURIComponent(order.trackingId)}`}
              className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-rose-900 border border-stone-300 text-xs font-bold shadow-sm transition"
            >
              📦 Track Shipment ({order.trackingId})
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs sm:text-sm font-extrabold shadow-md transition flex items-center gap-2"
          >
            <span>🖨️ Print / Save GST Invoice as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable A4 Tax Invoice Container */}
      <div
        id="gst-tax-invoice"
        className="max-w-4xl mx-auto bg-white rounded-2xl print:rounded-none border border-stone-300 print:border-stone-800 shadow-lg print:shadow-none p-6 sm:p-10 text-stone-900"
      >
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-stone-900 pb-6">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded bg-rose-900 text-amber-200 text-[10px] font-extrabold uppercase tracking-widest mb-2">
              ORIGINAL FOR RECIPIENT • TAX INVOICE (RULE 46 CGST RULES)
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-rose-950 tracking-tight uppercase">
              {sp.storeName}
            </h1>
            <p className="text-xs font-bold text-stone-700 mt-0.5">{sp.legalName}</p>
            <p className="text-xs text-stone-600 mt-1">{sp.address}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-stone-800 mt-2">
              <span>
                <strong>GSTIN:</strong> {sp.gstin}
              </span>
              <span>
                <strong>PAN:</strong> {sp.pan}
              </span>
              <span>
                <strong>State Code:</strong> {sp.stateCode} ({sp.stateName})
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-600 mt-1">
              <span>
                <strong>Email:</strong> {sp.supportEmail}
              </span>
              <span>
                <strong>Phone:</strong> {sp.supportPhone}
              </span>
            </div>
          </div>

          <div className="sm:text-right bg-stone-50 p-4 rounded-xl border border-stone-200 min-w-[250px]">
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-stone-400">
              GST Invoice Number
            </p>
            <p className="text-base font-mono font-extrabold text-stone-900">
              {order.invoiceNumber}
            </p>
            <div className="mt-2 pt-2 border-t border-stone-200 text-xs space-y-1">
              <p>
                <span className="text-stone-500">Order ID:</span>{' '}
                <strong className="font-mono">{order.orderId}</strong>
              </p>
              <p>
                <span className="text-stone-500">Invoice Date:</span>{' '}
                <strong>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
              </p>
              <p>
                <span className="text-stone-500">Supply Regime:</span>{' '}
                <strong>{order.supplyType}</strong>
              </p>
              <p>
                <span className="text-stone-500">Payment Status:</span>{' '}
                <strong
                  className={
                    order.status === 'CONFIRMED' || order.status === 'PAID'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }
                >
                  {order.status}
                </strong>
              </p>
              {order.paymentId && (
                <p>
                  <span className="text-stone-500">Payment Ref:</span>{' '}
                  <strong className="font-mono">{order.paymentId}</strong>
                </p>
              )}
              {order.trackingId && (
                <p>
                  <span className="text-stone-500">Tracking ID:</span>{' '}
                  <strong className="font-mono text-rose-900">{order.trackingId}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Billing & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-stone-200 text-xs">
          <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200">
            <h2 className="font-extrabold uppercase tracking-wider text-stone-400 text-[11px] mb-1.5">
              Billed & Shipped To (Consignee)
            </h2>
            <p className="text-sm font-bold text-stone-900">{order.customerName}</p>
            <p className="text-stone-700 mt-1 leading-relaxed">{order.address}</p>
            <div className="mt-2 pt-2 border-t border-stone-200/80 space-y-0.5">
              <p className="text-stone-800 font-semibold">Phone: +91 {order.phone}</p>
              {order.customerEmail && (
                <p className="text-stone-700">Email: {order.customerEmail}</p>
              )}
            </div>
          </div>

          <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200">
            <h2 className="font-extrabold uppercase tracking-wider text-stone-400 text-[11px] mb-1.5">
              Tax & Dispatch Metadata
            </h2>
            <p className="text-stone-700">
              <strong>Payment Mode:</strong> Direct UPI Instant Settlement
            </p>
            <p className="text-stone-700 mt-1">
              <strong>Tax Regime:</strong>{' '}
              {isIntra
                ? `Intra-State Supply (CGST ${halfRate}% + SGST ${halfRate}%)`
                : `Inter-State Supply (IGST ${gstRate}.0%)`}
            </p>
            <p className="text-stone-700 mt-1">
              <strong>Courier Partner:</strong>{' '}
              {order.courierName || 'BlueDart Royal Priority Air'}
            </p>
            <p className="text-stone-700 mt-1">
              <strong>Reverse Charge Applicable:</strong> No
            </p>
          </div>
        </div>

        {/* Line Items Table with HSN & GST Split */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-y-2 border-stone-900 bg-stone-100 text-stone-800 uppercase text-[11px]">
                <th className="py-2.5 px-2 font-extrabold">#</th>
                <th className="py-2.5 px-2 font-extrabold">Item Description</th>
                <th className="py-2.5 px-2 font-extrabold text-center">HSN/SAC</th>
                <th className="py-2.5 px-2 font-extrabold text-center">Size</th>
                <th className="py-2.5 px-2 font-extrabold text-center">Qty</th>
                <th className="py-2.5 px-2 font-extrabold text-right">Unit Price</th>
                <th className="py-2.5 px-2 font-extrabold text-right">Taxable Val</th>
                <th className="py-2.5 px-2 font-extrabold text-right">
                  {isIntra ? `CGST+SGST (${gstRate}%)` : `IGST (${gstRate}%)`}
                </th>
                <th className="py-2.5 px-2 font-extrabold text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {order.items?.map((item, idx) => {
                const lineTotal = item.price_paise * item.qty;
                const lineTaxable = Math.round((lineTotal * 100) / (100 + gstRate));
                const lineGst = lineTotal - lineTaxable;
                return (
                  <tr key={`${item.id}-${idx}`} className="text-stone-800">
                    <td className="py-3 px-2 font-mono text-stone-500">{idx + 1}</td>
                    <td className="py-3 px-2 font-bold text-stone-900">
                      {item.name}
                      <span className="block text-[10px] font-mono text-stone-500">
                        SKU: ZJ-{item.id}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-stone-600">
                      {item.hsn_code || '6204'}
                    </td>
                    <td className="py-3 px-2 text-center font-semibold">{item.size}</td>
                    <td className="py-3 px-2 text-center font-bold">{item.qty}</td>
                    <td className="py-3 px-2 text-right font-mono">{rupees(item.price_paise)}</td>
                    <td className="py-3 px-2 text-right font-mono">{rupees(lineTaxable)}</td>
                    <td className="py-3 px-2 text-right font-mono">{rupees(lineGst)}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-stone-900">
                      {rupees(lineTotal)}
                    </td>
                  </tr>
                );
              })}

              {/* Shipping Charge Line if applicable */}
              {shippingPaise > 0 && (
                <tr className="text-stone-800 bg-stone-50/60">
                  <td className="py-2.5 px-2 font-mono text-stone-500">
                    {(order.items?.length || 0) + 1}
                  </td>
                  <td className="py-2.5 px-2 font-semibold text-stone-800">
                    Insured Express Courier & Packaging Charges
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-stone-600">9968</td>
                  <td className="py-2.5 px-2 text-center">—</td>
                  <td className="py-2.5 px-2 text-center">1</td>
                  <td className="py-2.5 px-2 text-right font-mono">{rupees(shippingPaise)}</td>
                  <td className="py-2.5 px-2 text-right font-mono">
                    {rupees(Math.round((shippingPaise * 100) / (100 + gstRate)))}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono">
                    {rupees(
                      shippingPaise - Math.round((shippingPaise * 100) / (100 + gstRate))
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold">
                    {rupees(shippingPaise)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals, Amount in Words & GST Tax Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-stone-900">
          <div className="text-xs text-stone-600 space-y-2">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-stone-900">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                Total Invoice Amount in Words
              </span>
              <p className="font-bold text-xs mt-0.5">{rupeesInWords(order.amountPaise)}</p>
            </div>
            <p className="font-bold text-stone-800">Terms & Conditions:</p>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>All prices are inclusive of applicable GST under Indian GST Rules.</li>
              <li>
                7-day hassle-free size exchange available with original handloom tags intact.
              </li>
              <li>
                Authentic Jaipur Handloom & Craftsmanship • Tax is not payable under Reverse Charge.
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs sm:pl-8">
            <div className="flex justify-between text-stone-600">
              <span>Items Gross Subtotal:</span>
              <span className="font-mono font-semibold">
                {rupees(order.subtotalPaise || order.amountPaise)}
              </span>
            </div>
            {order.discountPaise > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Privilege Coupon Discount ({order.couponCode}):</span>
                <span className="font-mono">− {rupees(order.discountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Delivery / Shipping Charges (SAC 9968):</span>
              <span className="font-mono font-semibold text-emerald-700">
                {shippingPaise > 0 ? rupees(shippingPaise) : '₹0 (FREE)'}
              </span>
            </div>
            <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-200">
              <span>Net Taxable Value:</span>
              <span className="font-mono">{rupees(order.taxablePaise)}</span>
            </div>
            {isIntra ? (
              <>
                <div className="flex justify-between text-stone-600">
                  <span>Add: CGST @ {halfRate}% (Intra-State):</span>
                  <span className="font-mono">{rupees(order.cgstPaise)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Add: SGST @ {halfRate}% (Intra-State):</span>
                  <span className="font-mono">{rupees(order.sgstPaise)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-stone-600">
                <span>Add: IGST @ {gstRate}.0% (Inter-State):</span>
                <span className="font-mono">{rupees(order.igstPaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t-2 border-stone-900">
              <span>Grand Total (Inclusive of GST):</span>
              <span className="font-mono text-rose-900 text-lg">
                {rupees(order.amountPaise)}
              </span>
            </div>
            <div className="pt-6 text-right">
              <p className="text-[11px] font-bold text-stone-800">{sp.signatoryName}</p>
              <p className="text-[10px] text-stone-400 italic mt-0.5">
                Digitally Signed • Authorised Signatory (No physical signature required)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
