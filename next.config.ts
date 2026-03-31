import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this to handle UploadThing properly
  experimental: {
    serverComponentsExternalPackages: ["uploadthing"],
  },
};

export default nextConfig;
