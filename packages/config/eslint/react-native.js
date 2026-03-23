import expoConfig from "eslint-config-expo/flat.js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactNative from "eslint-plugin-react-native";
import tailwindcss from "eslint-plugin-tailwindcss";
import { config as baseConfig } from "./base.js";

/**
 * React Native + Expo + NativeWind ESLint config
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...expoConfig,
  // ...baseConfig,
  {
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-native": reactNative,
      tailwindcss,
    },

    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          project: true,
        },
      },
      tailwindcss: {
        callees: ["cn"],
      },
    },

    rules: {
      /* ---------------- React ---------------- */
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",

      /* ---------------- Hooks ---------------- */
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      /* ---------------- React Native ---------------- */
      "react-native/no-inline-styles": "off", // NativeWind
      "react-native/no-unused-styles": "warn",
      "react-native/split-platform-components": "warn",

      /* ---------------- Tailwind / NativeWind ---------------- */
      "tailwindcss/no-custom-classname": "off",
      "tailwindcss/classnames-order": "warn",
    },
  },
];
