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
        Generating GST Tax Invoice...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 p-6 text-center">
        <h1 className="text-xl font-bold text-stone-900 mb-2">Invoice Not Found</h1>
        <Link href="/" className="px-4 py-2 rounded-xl bg-stone-950 text-white text-xs font-bold">
          Return to Store
        </Link>
      </div>
    );
  }

  const sp: StoreProfileData = order.storeProfile || {
    storeName: 'ZARIYA JAIPUR — ROYAL ETHNIC HOUSE',
    legalName: 'Zariya Heritage Craft Pvt. Ltd.',
    gstin: '08AABCK7412R1Z5',
    pan: 'AABCK7412R',
    stateName: 'Rajasthan',
    stateCode: '08',
    address: 'Showroom 14, Heritage Arcade, MI Road, Jaipur, Rajasthan – 302001',
    supportEmail: 'concierge@zariyajaipur.in',
    supportPhone: '+91-9876543210',
    invoicePrefix: 'INV-KC-2026',
    freeShippingThresholdPaise: 99900,
    shippingChargePaise: 0,
    gstRatePercent: 5,
    signatoryName: 'For Zariya Heritage Craft Pvt. Ltd. — Authorized Signatory',
  };

  const isIntra = order.supplyType !== 'INTER_STATE';
  const gstRate = sp.gstRatePercent || 5;
  const halfRate = (gstRate / 2).toFixed(1);
  const shippingPaise = order.shippingPaise || 0;
  const grossSubtotal = order.subtotalPaise || order.amountPaise;
  const totalDiscount = order.discountPaise || 0;

  // Build HSN Summary buckets (like Myntra / Reliance / Tally ERP tax invoices)
  const hsnSummaryMap = new Map<
    string,
    { hsn: string; qty: number; taxablePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; totalTaxPaise: number }
  >();

  const computedLineRows = (order.items || []).map((item, idx) => {
    const grossLine = item.price_paise * item.qty;
    const itemDiscountShare =
      grossSubtotal > 0 ? Math.round((grossLine / grossSubtotal) * totalDiscount) : 0;
    const netLineInclusive = Math.max(0, grossLine - itemDiscountShare);
    const lineTaxable = Math.round((netLineInclusive * 100) / (100 + gstRate));
    const lineTax = netLineInclusive - lineTaxable;
    const lineCgst = isIntra ? Math.round(lineTax / 2) : 0;
    const lineSgst = isIntra ? lineTax - lineCgst : 0;
    const lineIgst = isIntra ? 0 : lineTax;
    const hsn = item.hsn_code || '6204';

    const cur = hsnSummaryMap.get(hsn) || {
      hsn,
      qty: 0,
      taxablePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalTaxPaise: 0,
    };
    cur.qty += item.qty;
    cur.taxablePaise += lineTaxable;
    cur.cgstPaise += lineCgst;
    cur.sgstPaise += lineSgst;
    cur.igstPaise += lineIgst;
    cur.totalTaxPaise += lineTax;
    hsnSummaryMap.set(hsn, cur);

    return {
      idx: idx + 1,
      sku: `ZJ-${String(item.id).padStart(3, '0')}`,
      name: item.name,
      size: item.size,
      hsn,
      qty: item.qty,
      unitGrossPaise: item.price_paise,
      grossLine,
      itemDiscountShare,
      lineTaxable,
      lineCgst,
      lineSgst,
      lineIgst,
      lineTax,
      netLineInclusive,
    };
  });

  const hsnSummaryRows = Array.from(hsnSummaryMap.values());
  const placeOfSupply = isIntra
    ? `${sp.stateCode} — ${sp.stateName} (Intra-State)`
    : 'Inter-State Supply (IGST)';

  return (
    <div className="min-h-screen bg-stone-200 py-6 sm:py-10 px-3 sm:px-6 print:bg-white print:p-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-5xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/order/${order.orderId}`}
            className="px-4 py-2 rounded-lg bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 text-xs font-bold shadow-xs transition"
          >
            Back to Order {order.orderId}
          </Link>
          <Link
            href="/profile"
            className="px-4 py-2 rounded-lg bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 text-xs font-bold shadow-xs transition"
          >
            My Profile & Orders
          </Link>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-sm transition"
        >
          Print / Download Official Tax Invoice (PDF)
        </button>
      </div>

      {/* Enterprise A4 GST Tax Invoice Sheet (Tally / Myntra / Reliance Retail Standard) */}
      <div
        id="gst-tax-invoice"
        className="max-w-5xl mx-auto bg-white border-2 border-stone-900 shadow-lg print:shadow-none text-stone-950 text-[11px] leading-snug"
      >
        {/* Top Statutory Title Bar */}
        <div className="border-b-2 border-stone-900 bg-stone-100 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <span className="font-extrabold uppercase tracking-[0.16em] text-xs">
            TAX INVOICE (ISSUED UNDER SECTION 31 OF CGST ACT, 2017 READ WITH RULE 46 OF CGST RULES)
          </span>
          <span className="font-mono font-bold uppercase text-[10px] border border-stone-900 px-2 py-0.5 bg-white">
            ORIGINAL FOR RECIPIENT
          </span>
        </div>

        {/* Row 1: Sold By (Seller) vs Tax Invoice Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-b border-stone-900">
          <div className="md:col-span-7 p-4 border-b md:border-b-0 md:border-r border-stone-900 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              SOLD BY / REGISTERED SUPPLIER:
            </p>
            <h1 className="text-base font-extrabold uppercase tracking-wide text-stone-950">
              {sp.legalName}
            </h1>
            <p className="font-semibold text-stone-800">Brand: {sp.storeName}</p>
            <p className="text-stone-700">{sp.address}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 font-mono text-[11px]">
              <div>
                <strong>GSTIN:</strong> {sp.gstin}
              </div>
              <div>
                <strong>PAN:</strong> {sp.pan}
              </div>
              <div>
                <strong>CIN:</strong> U18101RJ2021PTC074812
              </div>
              <div>
                <strong>State Code:</strong> {sp.stateCode} ({sp.stateName})
              </div>
            </div>
            <p className="text-stone-600 pt-1">
              <strong>Customer Care:</strong> {sp.supportEmail} | {sp.supportPhone}
            </p>
          </div>

          <div className="md:col-span-5 p-4 bg-stone-50/60 space-y-1.5 font-mono">
            <div className="flex justify-between border-b border-stone-300 pb-1">
              <span className="font-sans text-stone-600 font-semibold">Tax Invoice No:</span>
              <strong className="text-xs text-stone-950">{order.invoiceNumber}</strong>
            </div>
            <div className="flex justify-between border-b border-stone-300 pb-1">
              <span className="font-sans text-stone-600 font-semibold">Invoice Date:</span>
              <strong>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
            <div className="flex justify-between border-b border-stone-300 pb-1">
              <span className="font-sans text-stone-600 font-semibold">Order Reference:</span>
              <strong>{order.orderId}</strong>
            </div>
            <div className="flex justify-between border-b border-stone-300 pb-1">
              <span className="font-sans text-stone-600 font-semibold">Place of Supply:</span>
              <strong className="font-sans">{placeOfSupply}</strong>
            </div>
            <div className="flex justify-between border-b border-stone-300 pb-1">
              <span className="font-sans text-stone-600 font-semibold">Reverse Charge (RCM):</span>
              <strong className="font-sans">No</strong>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-stone-600 font-semibold">Payment Status:</span>
              <strong className="text-emerald-800">{order.status}</strong>
            </div>
          </div>
        </div>

        {/* Row 2: Billed To / Shipped To / Logistics Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-stone-900">
          <div className="md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-stone-900 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              DETAILS OF RECEIVER (BILLED TO):
            </p>
            <p className="font-extrabold text-xs text-stone-950">{order.customerName}</p>
            <p className="text-stone-700 leading-relaxed">{order.address}</p>
            <p className="font-mono pt-1">
              <strong>Phone:</strong> +91-{order.phone}
            </p>
            {order.customerEmail && (
              <p className="font-mono truncate">
                <strong>Email:</strong> {order.customerEmail}
              </p>
            )}
          </div>

          <div className="md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-stone-900 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              DETAILS OF CONSIGNEE (SHIPPED TO):
            </p>
            <p className="font-extrabold text-xs text-stone-950">{order.customerName}</p>
            <p className="text-stone-700 leading-relaxed">{order.address}</p>
            <p className="pt-1">
              <strong>Place of Delivery:</strong> {placeOfSupply}
            </p>
          </div>

          <div className="md:col-span-4 p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              PAYMENT & DISPATCH PARTICULARS:
            </p>
            <p>
              <strong>Payment Method:</strong> Prepaid UPI Settlement
            </p>
            <p className="font-mono">
              <strong>UTR / Payment Ref:</strong> {order.paymentId || 'UPI-VERIFIED'}
            </p>
            <p>
              <strong>Logistics Partner:</strong> {order.courierName || 'BlueDart Priority Air'}
            </p>
            <p className="font-mono">
              <strong>AWB Tracking ID:</strong> {order.trackingId || 'Pending Dispatch'}
            </p>
            {order.couponCode && (
              <p className="font-mono">
                <strong>Promo Code Applied:</strong> {order.couponCode}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Enterprise 10-Column Itemized Tax Table */}
        <div className="overflow-x-auto border-b-2 border-stone-900">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-900 text-[10px] uppercase font-extrabold text-stone-900">
                <th className="py-2 px-2 border-r border-stone-400 text-center w-8">S.No</th>
                <th className="py-2 px-2 border-r border-stone-400">SKU Code</th>
                <th className="py-2 px-2 border-r border-stone-400">
                  Product Description & Size
                </th>
                <th className="py-2 px-2 border-r border-stone-400 text-center">HSN/SAC</th>
                <th className="py-2 px-2 border-r border-stone-400 text-center">Qty</th>
                <th className="py-2 px-2 border-r border-stone-400 text-right">Gross Amt</th>
                <th className="py-2 px-2 border-r border-stone-400 text-right">Discount</th>
                <th className="py-2 px-2 border-r border-stone-400 text-right">Taxable Value</th>
                <th className="py-2 px-2 border-r border-stone-400 text-right">
                  {isIntra ? `CGST (${halfRate}%) + SGST (${halfRate}%)` : `IGST (${gstRate}%)`}
                </th>
                <th className="py-2 px-2 text-right">Net Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300 font-mono text-[11px]">
              {computedLineRows.map((row) => (
                <tr key={`${row.sku}-${row.idx}`}>
                  <td className="py-2.5 px-2 border-r border-stone-300 text-center">{row.idx}</td>
                  <td className="py-2.5 px-2 border-r border-stone-300 font-bold">{row.sku}</td>
                  <td className="py-2.5 px-2 border-r border-stone-300 font-sans">
                    <span className="font-bold text-stone-950 block">{row.name}</span>
                    <span className="text-[10px] text-stone-600">
                      Size / Variant: <strong>{row.size}</strong> | Unit Price:{' '}
                      {rupees(row.unitGrossPaise)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 border-r border-stone-300 text-center">{row.hsn}</td>
                  <td className="py-2.5 px-2 border-r border-stone-300 text-center font-bold">
                    {row.qty}
                  </td>
                  <td className="py-2.5 px-2 border-r border-stone-300 text-right">
                    {rupees(row.grossLine)}
                  </td>
                  <td className="py-2.5 px-2 border-r border-stone-300 text-right text-emerald-800">
                    {row.itemDiscountShare > 0 ? `- ${rupees(row.itemDiscountShare)}` : '₹0'}
                  </td>
                  <td className="py-2.5 px-2 border-r border-stone-300 text-right">
                    {rupees(row.lineTaxable)}
                  </td>
                  <td className="py-2.5 px-2 border-r border-stone-300 text-right">
                    {isIntra
                      ? `${rupees(row.lineCgst)} + ${rupees(row.lineSgst)}`
                      : rupees(row.lineIgst)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-extrabold text-stone-950">
                    {rupees(row.netLineInclusive)}
                  </td>
                </tr>
              ))}

              {shippingPaise > 0 && (
                <tr className="bg-stone-50/70">
                  <td className="py-2 px-2 border-r border-stone-300 text-center">
                    {computedLineRows.length + 1}
                  </td>
                  <td className="py-2 px-2 border-r border-stone-300 font-bold">SAC-9968</td>
                  <td className="py-2 px-2 border-r border-stone-300 font-sans font-semibold">
                    Express Courier & Insured Handling Charges
                  </td>
                  <td className="py-2 px-2 border-r border-stone-300 text-center">9968</td>
                  <td className="py-2 px-2 border-r border-stone-300 text-center">1</td>
                  <td className="py-2 px-2 border-r border-stone-300 text-right">
                    {rupees(shippingPaise)}
                  </td>
                  <td className="py-2 px-2 border-r border-stone-300 text-right">₹0</td>
                  <td className="py-2 px-2 border-r border-stone-300 text-right">
                    {rupees(Math.round((shippingPaise * 100) / (100 + gstRate)))}
                  </td>
                  <td className="py-2 px-2 border-r border-stone-300 text-right">
                    {rupees(shippingPaise - Math.round((shippingPaise * 100) / (100 + gstRate)))}
                  </td>
                  <td className="py-2 px-2 text-right font-bold">{rupees(shippingPaise)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-stone-100 border-t-2 border-stone-900 font-mono font-extrabold text-stone-950">
                <td colSpan={4} className="py-2.5 px-2 border-r border-stone-400 font-sans text-right uppercase">
                  Invoice Total:
                </td>
                <td className="py-2.5 px-2 border-r border-stone-400 text-center">
                  {computedLineRows.reduce((s, r) => s + r.qty, 0)}
                </td>
                <td className="py-2.5 px-2 border-r border-stone-400 text-right">
                  {rupees(grossSubtotal)}
                </td>
                <td className="py-2.5 px-2 border-r border-stone-400 text-right text-emerald-800">
                  {totalDiscount > 0 ? `- ${rupees(totalDiscount)}` : '₹0'}
                </td>
                <td className="py-2.5 px-2 border-r border-stone-400 text-right">
                  {rupees(order.taxablePaise)}
                </td>
                <td className="py-2.5 px-2 border-r border-stone-400 text-right">
                  {rupees(order.gstPaise)}
                </td>
                <td className="py-2.5 px-2 text-right text-xs">{rupees(order.amountPaise)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Row 4: HSN/SAC Tax Summary Table + Grand Total Block */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-stone-900">
          <div className="md:col-span-7 p-4 border-b md:border-b-0 md:border-r border-stone-900 space-y-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600 mb-1.5">
                HSN / SAC WISE TAX BREAKUP SUMMARY:
              </p>
              <table className="w-full border border-stone-400 text-[10px] font-mono border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-400 font-sans font-bold">
                    <th className="py-1 px-2 border-r border-stone-300 text-left">HSN/SAC</th>
                    <th className="py-1 px-2 border-r border-stone-300 text-right">Taxable Val</th>
                    <th className="py-1 px-2 border-r border-stone-300 text-right">
                      CGST ({halfRate}%)
                    </th>
                    <th className="py-1 px-2 border-r border-stone-300 text-right">
                      {isIntra ? `SGST (${halfRate}%)` : `IGST (${gstRate}%)`}
                    </th>
                    <th className="py-1 px-2 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300">
                  {hsnSummaryRows.map((h) => (
                    <tr key={h.hsn}>
                      <td className="py-1 px-2 border-r border-stone-300 font-bold">{h.hsn}</td>
                      <td className="py-1 px-2 border-r border-stone-300 text-right">
                        {rupees(h.taxablePaise)}
                      </td>
                      <td className="py-1 px-2 border-r border-stone-300 text-right">
                        {rupees(h.cgstPaise)}
                      </td>
                      <td className="py-1 px-2 border-r border-stone-300 text-right">
                        {rupees(isIntra ? h.sgstPaise : h.igstPaise)}
                      </td>
                      <td className="py-1 px-2 text-right font-bold">{rupees(h.totalTaxPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-stone-50 border border-stone-300 space-y-1">
              <p>
                <strong>Total Invoice Amount in Words:</strong>{' '}
                <span className="font-semibold">{rupeesInWords(order.amountPaise)}</span>
              </p>
              <p>
                <strong>Total GST Tax in Words:</strong>{' '}
                <span>{rupeesInWords(order.gstPaise)}</span>
              </p>
            </div>
          </div>

          <div className="md:col-span-5 p-4 flex flex-col justify-between space-y-2 font-mono">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="font-sans text-stone-600">Gross Merchandise Value:</span>
                <span>{rupees(grossSubtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span className="font-sans">Coupon Discount ({order.couponCode}):</span>
                  <span>- {rupees(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-sans text-stone-600">Shipping & Handling (SAC 9968):</span>
                <span>{shippingPaise > 0 ? rupees(shippingPaise) : '₹0.00 (FREE)'}</span>
              </div>
              <div className="flex justify-between border-t border-stone-300 pt-1">
                <span className="font-sans text-stone-600">Net Taxable Value:</span>
                <span>{rupees(order.taxablePaise)}</span>
              </div>
              {isIntra ? (
                <>
                  <div className="flex justify-between">
                    <span className="font-sans text-stone-600">Add: Central GST ({halfRate}%):</span>
                    <span>{rupees(order.cgstPaise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-stone-600">Add: State GST ({halfRate}%):</span>
                    <span>{rupees(order.sgstPaise)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="font-sans text-stone-600">Add: Integrated GST ({gstRate}%):</span>
                  <span>{rupees(order.igstPaise)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-stone-900 pt-2 text-sm font-extrabold text-stone-950">
                <span className="font-sans uppercase">Grand Total (Inclusive of GST):</span>
                <span>{rupees(order.amountPaise)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 5: Statutory Declaration, Numbering Legend & Authorized Signatory */}
        <div className="grid grid-cols-1 md:grid-cols-12 p-4 gap-4 items-end">
          <div className="md:col-span-8 space-y-1.5 text-[10px] text-stone-700">
            <p className="font-bold uppercase text-stone-900">Declaration & Terms of Sale:</p>
            <p>
              1. We declare that this tax invoice shows the actual price of the goods described and that all particulars are true and correct.
            </p>
            <p>
              2. All disputes are subject to Jaipur (Rajasthan) jurisdiction only. 7-day size exchange valid with original barcode tags intact.
            </p>
            <p className="font-mono text-[9.5px] text-stone-600 pt-1">
              <strong>Document Numbering Key:</strong> Order ID <code>{order.orderId}</code> = <code>ORD</code> + 6-Digit Date (<code>YYMMDD</code>) + State Code (<code>08</code>) + 4-Digit Serial | Invoice <code>{order.invoiceNumber}</code> = <code>INV-KC-2026-NNNN</code> (16-Char CGST Rule 46b Format).
            </p>
          </div>

          <div className="md:col-span-4 text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-stone-300">
            <p className="font-bold text-stone-950 text-[11px]">For {sp.legalName}</p>
            <div className="my-3 inline-block px-3 py-1 border border-stone-800 font-mono text-[9px] uppercase tracking-wider bg-stone-50">
              DIGITALLY VERIFIED TAX DOCUMENT
            </div>
            <p className="text-[10px] text-stone-600">
              Authorized Signatory (Computer Generated Invoice — No Physical Signature Required under Rule 46)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
