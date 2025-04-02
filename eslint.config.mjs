// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  stylistic.configs.all,
  stylistic.configs.customize(
    {
      indent: 2,
      quotes: "double",
      commaDangle: "never",
      quoteProps: "as-needed",
      arrowParens: false,
      blockSpacing: true,
      braceStyle: "1tbs",
      semi: true
    }
  ),
  {
    languageOptions: {
      parserOptions: {
        project: true
      }
    }
  }
);
