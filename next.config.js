/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Security headers applied to all routes.
   * CSP is deferred to Wave 3 — it requires an audit of all inline scripts and
   * third-party origins (Vercel Analytics, fonts, etc.) before it can be set
   * without breaking the app.
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
        ],
      },
    ]
  },
};

module.exports = nextConfig;
