import type { NextConfig } from "next";

// GitHub Pages: repo is at /portfolio on mccomark21.github.io
// Set NEXT_PUBLIC_BASE_PATH="" to deploy to a custom domain root instead.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/portfolio";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
