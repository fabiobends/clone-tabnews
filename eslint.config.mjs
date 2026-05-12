import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import jestPlugin from "eslint-plugin-jest";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const config = [
  { ignores: [".next/**"] },
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  jestPlugin.configs["flat/recommended"],
  prettierConfig,
];

export default config;
