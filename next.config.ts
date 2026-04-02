import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this to handle UploadThing properly
  serverExternalPackages: ["uploadthing"],
};

export default nextConfig;
