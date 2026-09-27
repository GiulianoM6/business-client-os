import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Local builds may share dependencies with another checkout under this root.
  turbopack: process.env.BCOS_TURBOPACK_ROOT ? { root: process.env.BCOS_TURBOPACK_ROOT } : undefined,
  // Optional build-only accommodation for hosts that restrict child processes.
  experimental: {
    workerThreads: process.env.BCOS_BUILD_WORKER_THREADS === "1",
    useTypeScriptCli: process.env.BCOS_BUILD_WORKER_THREADS !== "1",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default nextConfig;
