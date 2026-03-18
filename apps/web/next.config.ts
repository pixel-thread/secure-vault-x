import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@securevault/validators", "@securevault/constants", "@securevault/crypto", "@securevault/utils", "@securevault/types"],
};

export default nextConfig;
