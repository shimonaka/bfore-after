import path from 'node:path';

const isStaticExport = process.env.STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve('.'),
  },
  ...(isStaticExport && {
    output: 'export',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
