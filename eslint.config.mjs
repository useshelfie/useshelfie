import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "plugin:prettier/recommended"),
  {
    rules: {
      semi: "off",
      "prettier/prettier": "error",
    },
    ignores: [
      ".eslintrc.cjs",
      "next.config.mjs",
      "tailwind.config.js",
      "postcss.config.js",
      "components/ui/*",
      ".prettierrc",
    ],
  },
]

export default eslintConfig
