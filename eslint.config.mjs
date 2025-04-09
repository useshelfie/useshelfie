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
      indent: ["error", 2, { SwitchCase: 1 }],
      "prettier/prettier": "error",
    },
    // Ignoring Shadncn/UI Components and config files to avoid lint issues
    ignores: [".eslintrc.cjs", "next.config.mjs", "tailwind.config.js", "postcss.config.js", "components/ui/*"],
  },
]

export default eslintConfig
