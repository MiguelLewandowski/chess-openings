import path from "node:path";
import type { NextConfig } from "next";

// The repo root. Next infers a workspace root on its own, but in this monorepo it guesses
// wrong (the domain package is symlinked in from outside apps/web), so it is set here.
const repoRoot = path.resolve(__dirname, "..", "..");

const nextConfig: NextConfig = {
  // Emits a self-contained server bundle with only the dependencies actually used, so the
  // Docker image does not have to carry the whole workspace's node_modules.
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
};

export default nextConfig;
