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
  // Dev only: lets the app be opened at 127.0.0.1 (a separate cookie jar from other apps on
  // localhost). Next 16 blocks dev resources for any other host, which leaves pages without JS.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
