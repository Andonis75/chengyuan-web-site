import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/chengyuan-web-site",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
