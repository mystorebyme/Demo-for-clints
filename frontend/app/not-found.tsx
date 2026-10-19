import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-4 my-12 shadow-sm">
      <p className="text-4xl font-extrabold text-brand">404</p>
      <h1 className="text-xl font-bold text-gray-900">Page Not Found / पेज नहीं मिला</h1>
      <p className="text-sm text-gray-600">
        The page or product you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block bg-brand text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-brand-dark"
      >
        ← Return to Catalog
      </Link>
    </div>
  );
}
