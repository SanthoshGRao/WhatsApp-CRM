import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow serving form.html from public folder
  async rewrites() {
    return [
      {
        source: "/register",
        destination: "/form.html",
      },
    ];
  },
};

export default nextConfig;
