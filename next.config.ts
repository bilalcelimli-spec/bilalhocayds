import type { NextConfig } from "next";

// Platform içi canlı sınıf (LiveKit) için sinyal sunucusu kaynakları.
function getLiveKitConnectSources() {
  const sources = new Set(["wss://*.livekit.cloud", "https://*.livekit.cloud"]);
  const configured = process.env.LIVEKIT_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      const host = url.host;
      sources.add(`wss://${host}`);
      sources.add(`https://${host}`);
    } catch {
      // Geçersiz LIVEKIT_URL: varsayılan LiveKit Cloud kaynaklarıyla devam et.
    }
  }
  return [...sources].join(" ");
}

const securityHeaders = [
  // Prevents MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking protection
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Force HTTPS for 2 years (production only)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Control referrer info sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable sensitive browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // XSS protection (legacy browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline for hydration scripts; unsafe-eval for dev
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paytr.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      // Allow PayTR iframe for payment
      "frame-src https://www.paytr.com",
      "frame-ancestors 'self'",
      `connect-src 'self' https://www.paytr.com ${getLiveKitConnectSources()}`,
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://www.paytr.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Canlı sınıf sayfası kamera, mikrofon ve ekran paylaşımına ihtiyaç duyar.
        source: "/classroom/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
