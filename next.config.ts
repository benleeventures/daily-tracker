import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Static page in /public/newsitev1 (unlisted, noindex while we collect feedback)
      { source: '/newsitev1', destination: '/newsitev1/index.html' },
    ];
  },
  async headers() {
    // Public, read-only assets used by the Framer-hosted offer page (benlee.ventures/run-like-recenter)
    const cors = [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400' },
    ];
    return [
      { source: '/newsitev1/olr.html', headers: cors },
      { source: '/newsitev1/olr.js', headers: cors },
      { source: '/newsitev1/fonts/:path*', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }, { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/newsitev1/img/:path*', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }] },
      { source: '/newsitev1/logos/:path*', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }] },
      { source: '/newsitev1/brand/:path*', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }] },
    ];
  },
  async redirects() {
    return [
      // Old spelling — keeps previously shared meeting links working
      { source: '/dailys/:path*', destination: '/dailies/:path*', permanent: true },
      // Instinct was given this path for the nightly note form; the page itself lives at /gut/ingest
      { source: '/gut/instinct', destination: '/gut/ingest', permanent: false },
    ];
  },
};

export default nextConfig;
