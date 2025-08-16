import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure API routes are properly handled
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  // Disable turbopack in production for better compatibility
  ...(process.env.NODE_ENV === "production" && {
    turbopack: false,
  }),
  // Enable turbopack only in development
  ...(process.env.NODE_ENV === "development" && {
    turbopack: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  }),
};

export default nextConfig;
