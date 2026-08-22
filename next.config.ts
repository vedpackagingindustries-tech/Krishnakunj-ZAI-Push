import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // Removed for Z.ai Preview compatibility
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
