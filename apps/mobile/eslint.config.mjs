import { config } from "@securevault/config-eslint/react-native";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ["dist/*", "android/*", "ios/*"],
  },
  {
    rules: {
      "react/display-name": "off",
    },
  },
];
