const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    ignores: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      indent: ['error', 2, { SwitchCase: 1 }],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-trailing-spaces': 'error'
    }
  },
  // Browser environment for public files
  {
    files: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        location: 'readonly',
        prompt: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        navigator: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern:
            '^(handleCommandKey|loadDeviceProperties|loadProcesses|loadPackages|loadStorageInfo|loadLogs)$'
        }
      ],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];
