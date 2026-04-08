import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ikkpzqzhfmbskfwlcuxl.supabase.co",
      },
    ],
  },
};

export default nextConfig;
