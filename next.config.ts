import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure API routes are properly handled
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  // Disable turbopack completely for better production compatibility
  turbopack: false,
  // Ensure proper API route handling
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
