import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old spelling — keeps previously shared meeting links working
      { source: '/dailys/:path*', destination: '/dailies/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
