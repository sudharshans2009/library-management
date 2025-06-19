/** @type {import('next').NextConfig} */
const { experimental: _experimental, ...nextConfig } = {
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
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  experimental: {
    reactCompiler: true,
    authInterrupts: true,
    cssChunking: true,
    dynamicIO: true,
    ppr: true,
    useCache: true,
    useLightningcss: true,
    viewTransitions: true,
  },
};
export default nextConfig;
