import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/assets/.*',
        search: '.*',
      },
    ],
  },
};

export default nextConfig;
