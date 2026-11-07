/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  // 开发 / 部署都是标准 Next 应用；静态导出仅用于 Desktop 预览兼容
  output: 'export',
  trailingSlash: true,
  basePath: basePath || undefined,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
  reactStrictMode: true,
  transpilePackages: ['@classic/ui'],
};

export default nextConfig;
