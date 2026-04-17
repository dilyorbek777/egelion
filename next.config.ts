import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this to handle UploadThing properly
  serverExternalPackages: ["uploadthing"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cbi4htdmcm.ufs.sh",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
