/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Security headers applied to all routes.
   * CSP below deliberately has no script-src/connect-src so it cannot break
   * Stripe, Supabase, analytics, or inline Next scripts — tightening
   * script-src is a later task (2026-09-07 security-fix batch).
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // Prevent the site from being embedded in an iframe — protects
            // against clickjacking attacks on the admin panel.
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Prevent browsers from MIME-sniffing a response away from the
            // declared Content-Type, reducing drive-by download risk.
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Send full URL origin on same-origin requests; send only the
            // origin (no path) on cross-origin requests; send nothing on
            // downgrade (HTTPS→HTTP).
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Disable all sensitive browser features that the site does not use.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Force HTTPS on every future visit, including subdomains.
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Narrow, non-breaking baseline: blocks the site being framed
            // elsewhere, blocks base-tag hijacking, and blocks plugin
            // embeds — without touching script-src/connect-src.
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests",
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
