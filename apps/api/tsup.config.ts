import { defineConfig } from "tsup";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  // Entry point — only the Vercel handler
  entry: ["api/index.ts"],

  // Output format — ESM only for Vercel/Node20+
  format: ["esm"],

  // Output directory
  outDir: "dist",

  // ✅ Bundle EVERYTHING including workspace packages
  // This is the key setting that fixes Vercel module resolution
  noExternal: [/.*/],

  // ✅ Tree-shake unused code — smaller bundle, faster cold start
  treeshake: true,

  // One output file — no code splitting needed for API
  splitting: false,

  // Clean dist/ before every build
  clean: true,

  // Sourcemaps in dev, off in prod
  sourcemap: isDev,

  // Minify in production
  minify: !isDev,

  // Don't bundle Node built-ins (fs, path, crypto etc)
  // Vercel provides these
  platform: "node",

  // Target Node 20 (matches Vercel runtime)
  target: "node20",

  // Show what's being bundled
  metafile: true,

  // Silence noisy output in CI
  silent: false,

  // TypeScript config
  tsconfig: "tsconfig.json",
});
