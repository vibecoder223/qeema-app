import type { NextConfig } from "next";

/* Static export: the app is plain files, so GitHub Pages (or any static host) can serve it.
   On GitHub Pages it lives under /<repo>, set by the deploy workflow through NEXT_PUBLIC_BASE_PATH. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;
