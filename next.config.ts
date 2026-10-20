import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/download",
        destination: "/dw",
        permanent: false,
      },
      {
        source: "/app",
        destination: "/dw",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
