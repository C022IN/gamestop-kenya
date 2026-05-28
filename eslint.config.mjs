import nextConfig from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  {
    ignores: ['.next/**', '.next-dev/**', 'node_modules/**', 'output/**', 'next-env.d.ts'],
  },
  ...nextConfig,
  ...nextCoreWebVitals,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'jsx-a11y/alt-text': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/static-components': 'off',
    },
  },
];

export default eslintConfig;
