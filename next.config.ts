import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    reactCompiler: true,
    authInterrupts: true,
    cssChunking: true,
    dynamicIO: true,
    ppr: true,
    useCache: true,
    useLightningcss: true,
    viewTransition: true,
  },
};

export default nextConfig;
