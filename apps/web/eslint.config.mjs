import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // public/stockfish is the minified engine copied from node_modules, not our code.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/stockfish/**"]),
]);

export default eslintConfig;
