import type { NextConfig } from 'next';

type CustomExperimentalConfig = NextConfig['experimental'] & {
  missingSuspenseWithCSRBailout?: boolean;
};

const nextConfig: NextConfig = {
  images: {
    domains: ['example.com'],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    disableStaticImages: false,
  },
  productionBrowserSourceMaps: false,
  optimizeFonts: true,
  compress: true,
  experimental: {
    externalDir: true,
    fallbackNodePolyfills: false,
  } as CustomExperimentalConfig,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
