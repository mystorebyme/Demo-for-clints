/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/products/:slug.webp',
        destination: '/products/:slug.svg',
      },
    ];
  },
};

module.exports = nextConfig;
