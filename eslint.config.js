/* eslint-disable @typescript-eslint/no-unsafe-argument */
// @ts-check

//import eslint from "@eslint/js";
const eslint = require('@eslint/js')
//import tseslint from "typescript-eslint";
const tseslint = require('typescript-eslint')
//import stylistic from "@stylistic/eslint-plugin";
const stylistic = require('@stylistic/eslint-plugin')

module.exports = [
  ...tseslint.config(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    eslint.configs.recommended,
    ...tseslint.configs.stylisticTypeChecked,
    ...tseslint.configs.strictTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          project: true
        }
      }
    }
  ),
  stylistic.configs.customize({
    indent: 2,
    quotes: "double",
    commaDangle: "never",
    quoteProps: "as-needed",
    arrowParens: false,
    blockSpacing: true,
    braceStyle: "1tbs",
    flat: true,
    semi: true
  })
];
