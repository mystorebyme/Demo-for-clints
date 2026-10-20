import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Zariya Jaipur — Royal Ethnic House | Handcrafted Kurtis, Artisan Bags & Jadau Jewellery',
    template: '%s | Zariya Jaipur',
  },
  description:
    'Jaipur’s premier royal ethnic house for handcrafted Sanganeri Kurtis, Kutchi Artisan Bags, and Bikaneri Jadau Jewellery with instant GST invoicing and confidential shipment tracking.',
  keywords: [
    'Zariya Jaipur',
    'Jaipur Kurtis',
    'Sanganeri Block Print Kurti',
    'Kutchi Mirror Work Bag',
    'Bikaneri Jadau Jewellery',
    'Bridal Potli',
    'Royal Ethnic Wear India',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#faf7f2] text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
