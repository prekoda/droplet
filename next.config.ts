import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
// PWA plugin disabled due to build crash on Windows/Next.js 16 (libuv assertion failure)
// export default withPWA(nextConfig);
