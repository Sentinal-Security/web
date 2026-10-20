import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
