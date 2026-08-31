import type { NextConfig } from "next";

// PAGES=true builds for the GitHub Pages demo (served from /apu-cgpa-calculator).
// The default build (Vercel) serves from the root with no basePath.
const isPages = process.env.PAGES === "true";
const repo = "apu-cgpa-calculator";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isPages ? `/${repo}` : "",
  assetPrefix: isPages ? `/${repo}/` : undefined,
};

export default nextConfig;
