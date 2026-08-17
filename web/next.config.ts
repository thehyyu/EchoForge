import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      { source: "/n8n-handbook", destination: "/n8n-handbook/index.html" },
      { source: "/n8n-handbook/", destination: "/n8n-handbook/index.html" },
    ];
  },
};

export default nextConfig;
