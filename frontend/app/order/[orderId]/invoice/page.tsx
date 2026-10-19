'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import { rupees, useStore } from '../../../../lib/store';

type InvoiceOrder = {
  orderId: string;
  invoiceNumber: string;
  status: string;
  trackingId: string | null;
  courierName: string;
  customerName: string;
  phone: string;
  address: string;
  subtotalPaise: number;
  discountPaise: number;
  couponCode: string | null;
  gstPaise: number;
  amountPaise: number;
  paymentId?: string | null;
  createdAt: string;
  items: Array<{
    id: number;
    name: string;
    name_hi?: string;
    qty: number;
    size: string;
    price_paise: number;
    line_total_paise: number;
    hsn_code?: string;
  }>;
};

export default function OrderInvoicePage() {
  const params = useParams();
  const orderId = String(params?.orderId || '');
  const { lang, t } = useStore();
  const [order, setOrder] = useState<InvoiceOrder | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok || !d.success) {
          setError(d.error || 'Invoice not found');
          return;
        }
        setOrder(d);
      })
      .catch(() => setError('Unable to load invoice'));
  }, [orderId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-stone-900 mb-3">{error}</h1>
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-rose-800 text-white text-sm font-bold">
            ← {t('continueShopping')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center text-stone-500">
          Generating GST Tax Invoice...
        </main>
        <Footer />
      </div>
    );
  }

  const taxablePaise = Math.max(0, order.amountPaise - (order.gstPaise || Math.round((order.amountPaise * 5) / 105)));
  const cgstPaise = Math.round((order.gstPaise || Math.round((order.amountPaise * 5) / 105)) / 2);
  const sgstPaise = (order.gstPaise || Math.round((order.amountPaise * 5) / 105)) - cgstPaise;

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 print:bg-white">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 print:p-0">
        {/* Action Bar (hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <Link
              href={`/order/${order.orderId}`}
              className="px-4 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700"
            >
              ← Back to Order
            </Link>
            {order.trackingId && (
              <Link
                href={`/track?id=${encodeURIComponent(order.trackingId)}`}
                className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold"
              >
                📦 Track Shipment ({order.trackingId})
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2"
          >
            <span>🖨️</span>
            <span>{t('printInvoice')}</span>
          </button>
        </div>

        {/* Printable GST Tax Invoice Document */}
        <div className="bg-white rounded-3xl border border-stone-300 shadow-sm p-6 sm:p-10 print:shadow-none print:border-stone-400 print:rounded-none">
          {/* Top Header */}
          <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b-2 border-stone-900">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-rose-800 text-white font-bold text-sm flex items-center justify-center">
                  KC
                </span>
                <span className="text-xl font-extrabold text-stone-900 tracking-tight">
                  KRANTI CLASSES ETHNIC WEAR BOUTIQUE
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Showroom 14, Heritage Arcade, MI Road, Jaipur, Rajasthan – 302001
                <br />
                <strong>GSTIN:</strong> <span className="font-mono">08AABCK7412R1Z5</span> •{' '}
                <strong>PAN:</strong> <span className="font-mono">AABCK7412R</span> •{' '}
                <strong>State Code:</strong> 08 (Rajasthan)
                <br />
                <strong>Support:</strong> support@kranticlasses-store.in • +91-9876543210
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-lg bg-stone-900 text-white text-xs font-extrabold uppercase tracking-wider">
                {t('taxInvoice')} / मूल प्रति
              </span>
              <p className="text-xs text-stone-600 mt-2">
                <strong>Invoice No:</strong>{' '}
                <span className="font-mono font-bold text-stone-900">
                  {order.invoiceNumber || `INV-KC-2026-${order.orderId.slice(-6)}`}
                </span>
              </p>
              <p className="text-xs text-stone-600">
                <strong>Order ID:</strong>{' '}
                <span className="font-mono font-bold text-stone-900">{order.orderId}</span>
              </p>
              <p className="text-xs text-stone-600">
                <strong>Invoice Date:</strong>{' '}
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {order.trackingId && (
                <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                  <strong>AWB / Tracking ID:</strong>{' '}
                  <span className="font-mono">{order.trackingId}</span> ({order.courierName})
                </p>
              )}
            </div>
          </div>

          {/* Billing & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-stone-200 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-stone-400 mb-1">
                Billed & Shipped To (ग्राहक विवरण)
              </p>
              <p className="text-sm font-extrabold text-stone-900">{order.customerName}</p>
              <p className="text-stone-700 mt-0.5 leading-relaxed">{order.address}</p>
              <p className="text-stone-700 mt-1">
                <strong>Phone:</strong> +91-{order.phone}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="font-bold uppercase tracking-wider text-stone-400 mb-1">
                Payment & Supply Metadata
              </p>
              <p className="text-stone-700">
                <strong>Payment Status:</strong>{' '}
                <span
                  className={`font-bold ${
                    order.status === 'CONFIRMED' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {order.status}
                </span>
              </p>
              <p className="text-stone-700 mt-0.5">
                <strong>Payment Mode:</strong> Dynamic UPI QR (Server Webhook Verified)
              </p>
              {order.paymentId && (
                <p className="text-stone-700 mt-0.5">
                  <strong>Gateway Ref / UTR:</strong>{' '}
                  <span className="font-mono">{order.paymentId}</span>
                </p>
              )}
              <p className="text-stone-700 mt-0.5">
                <strong>Place of Supply:</strong> India (Inter/Intra-State B2C Retail)
              </p>
            </div>
          </div>

          {/* Itemized HSN Table */}
          <div className="my-6 overflow-x-auto">
            <table className="w-full text-xs border border-stone-300">
              <thead className="bg-stone-100 text-stone-800 font-bold">
                <tr>
                  <th className="p-2.5 border-b border-r border-stone-300 text-left">#</th>
                  <th className="p-2.5 border-b border-r border-stone-300 text-left">
                    Item Description (उत्पाद विवरण)
                  </th>
                  <th className="p-2.5 border-b border-r border-stone-300 text-center">HSN</th>
                  <th className="p-2.5 border-b border-r border-stone-300 text-center">Size</th>
                  <th className="p-2.5 border-b border-r border-stone-300 text-center">Qty</th>
                  <th className="p-2.5 border-b border-r border-stone-300 text-right">Unit Rate</th>
                  <th className="p-2.5 border-b border-stone-300 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {order.items.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`}>
                    <td className="p-2.5 border-r border-stone-300 font-mono">{idx + 1}</td>
                    <td className="p-2.5 border-r border-stone-300">
                      <span className="font-bold text-stone-900">{item.name}</span>
                      {item.name_hi && (
                        <span className="block text-[11px] text-stone-500">{item.name_hi}</span>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-stone-300 text-center font-mono">
                      {item.hsn_code || '6204'}
                    </td>
                    <td className="p-2.5 border-r border-stone-300 text-center">{item.size}</td>
                    <td className="p-2.5 border-r border-stone-300 text-center font-bold">
                      {item.qty}
                    </td>
                    <td className="p-2.5 border-r border-stone-300 text-right">
                      {rupees(item.price_paise)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-stone-900">
                      {rupees(item.line_total_paise || item.price_paise * item.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax & Total Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end pt-2">
            <div className="text-[11px] text-stone-500 space-y-1.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <p className="font-bold text-stone-800">Terms & Declaration:</p>
              <p>
                1. We declare that this invoice shows the actual price of the goods described and
                that all particulars are true and correct.
              </p>
              <p>
                2. Easy 7-day size exchange available from Jaipur fulfillment warehouse with intact
                tags.
              </p>
              <p className="font-mono text-[10px] text-stone-400 pt-1">
                Computer Generated GST Invoice — Digital Signature Verified
              </p>
            </div>

            <div className="space-y-2 text-xs border border-stone-300 rounded-2xl p-4 bg-stone-50/50">
              <div className="flex justify-between text-stone-600">
                <span>Item Subtotal (MRP Incl. Tax):</span>
                <span className="font-semibold text-stone-900">
                  {rupees(order.subtotalPaise || order.amountPaise)}
                </span>
              </div>
              {order.discountPaise > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Promo Discount ({order.couponCode || 'COUPON'}):</span>
                  <span>− {rupees(order.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Net Taxable Value:</span>
                <span>{rupees(taxablePaise)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>CGST (2.5% Apparel/Ethnic):</span>
                <span>{rupees(cgstPaise)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>SGST (2.5% Apparel/Ethnic):</span>
                <span>{rupees(sgstPaise)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Insured Courier Shipping:</span>
                <span className="text-emerald-700 font-bold">FREE (₹0)</span>
              </div>
              <div className="border-t-2 border-stone-900 pt-2.5 flex justify-between text-sm font-extrabold text-stone-900">
                <span>Grand Total (कुल राशि):</span>
                <span className="text-rose-900 text-base">{rupees(order.amountPaise)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span>
              {lang === 'hi'
                ? 'क्रांति क्लासेस एथनिक वियर से खरीदारी के लिए धन्यवाद!'
                : 'Thank you for shopping with Kranti Classes Ethnic Wear, Jaipur!'}
            </span>
            <span className="font-bold text-stone-800">
              For Kranti Classes Boutique — Authorized Signatory
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
