import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/register",
        destination: "/form.html",
      },
    ];
  },
  serverExternalPackages: ["pdf-parse", "xlsx"],
};
export default nextConfig;
