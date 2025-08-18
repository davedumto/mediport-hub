import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure API routes are properly handled
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
