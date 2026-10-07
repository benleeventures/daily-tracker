import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Static page in /public/newsitev1 (unlisted, noindex while we collect feedback)
      { source: '/newsitev1', destination: '/newsitev1/index.html' },
    ];
  },
  async redirects() {
    return [
      // Old spelling — keeps previously shared meeting links working
      { source: '/dailys/:path*', destination: '/dailies/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
