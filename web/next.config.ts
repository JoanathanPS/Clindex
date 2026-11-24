import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ["@clindex/clinical", "@clindex/find", "@clindex/rx-core", "@clindex/ui"],
};

export default nextConfig;
