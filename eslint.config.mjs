import { fixupPluginRules } from '@eslint/compat';
import nextConfig from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/**
 * Polyfills scopeManager.addGlobals() for parsers that bundle an old
 * eslint-scope (pre-9.x) — specifically next/dist/compiled/babel/eslint-parser.
 * ESLint 10 calls this method unconditionally; the babel parser's embedded
 * eslint-scope predates it.
 */
function polyfillScopeManager(scopeManager) {
  if (!scopeManager || typeof scopeManager.addGlobals === 'function') {
    return scopeManager;
  }
  scopeManager.addGlobals = function addGlobals(names) {
    const globalScope = this.scopes[0];
    if (!globalScope) return;
    for (const name of names) {
      if (!globalScope.set.has(name)) {
        const variable = { name, scope: globalScope, identifiers: [], references: [], defs: [] };
        globalScope.set.set(name, variable);
        globalScope.variables.push(variable);
      }
    }
  };
  return scopeManager;
}

function wrapParser(parser) {
  if (!parser?.parseForESLint) return parser;
  return {
    ...parser,
    parseForESLint(code, options) {
      const result = parser.parseForESLint(code, options);
      if (result?.scopeManager) polyfillScopeManager(result.scopeManager);
      return result;
    },
  };
}

function patchConfigs(configs) {
  return configs.map((config) => {
    const patched = { ...config };

    if (config.plugins) {
      patched.plugins = Object.fromEntries(
        Object.entries(config.plugins).map(([name, plugin]) => [
          name,
          fixupPluginRules(plugin),
        ])
      );
    }

    if (config.languageOptions?.parser) {
      patched.languageOptions = {
        ...config.languageOptions,
        parser: wrapParser(config.languageOptions.parser),
      };
    }

    return patched;
  });
}

const eslintConfig = [
  {
    ignores: ['.next/**', '.next-dev/**', 'node_modules/**', 'output/**', 'next-env.d.ts'],
  },
  ...patchConfigs(nextConfig),
  ...patchConfigs(nextCoreWebVitals),
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
