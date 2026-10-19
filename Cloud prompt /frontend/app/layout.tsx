import './globals.css';
import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Kurti Corner — Ethnic Kurtis, Handbags & Fashion Accessories',
    template: '%s | Kurti Corner',
  },
  description:
    'Mobile-first bilingual (English / हिंदी) Indian fashion storefront for Kurtis, Handbags, and Accessories with server-verified checkout.',
  keywords: ['Kurtis', 'Handbags', 'Indian Ethnic Wear', 'Jhumka', 'Chikankari Kurti', 'Jaipur Fashion'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fafafa] text-gray-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-brand focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
