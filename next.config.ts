import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure API routes are properly handled
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  // Disable turbopack completely for better production compatibility
  turbopack: false,
};

export default nextConfig;
