import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/assets/.*',
      },
    ],
  },
};

export default nextConfig;
