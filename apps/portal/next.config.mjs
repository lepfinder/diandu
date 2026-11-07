/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ['@classic/catalog', '@classic/ui'],
};

export default nextConfig;
