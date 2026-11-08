/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: basePath || undefined,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
  reactStrictMode: true,
  transpilePackages: ['@classic/reader', '@classic/ui'],
};

export default nextConfig;
