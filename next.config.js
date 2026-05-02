/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
};

// Cloudflare Pages edge runtime setup
if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
  setupDevPlatform().catch(() => {});
}

module.exports = nextConfig;
