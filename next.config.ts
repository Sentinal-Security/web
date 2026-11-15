import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/landingpage",
        destination: "/",
        permanent: true,
      },
      {
        source: "/dw",
        destination: "/download",
        permanent: true,
      },
      {
        source: "/app",
        destination: "/download",
        permanent: false,
      },
      {
        source: "/builds/:path*",
        destination: "https://backend-pi68.onrender.com/api/builds/download",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
