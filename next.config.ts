import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/assets/(cover|pdf)',
      },
    ],
  },
};

export default nextConfig;
