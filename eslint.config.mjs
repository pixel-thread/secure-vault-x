import { config } from "./packages/config/eslint/base.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/build/**", ".next/**"],
  },
];
