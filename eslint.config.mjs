import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
    js.configs.recommended,
    ...tseslint.configs.recommended,
    { ignores: ['**/dist'] },
    {
        languageOptions: {
            globals: {
                require: 'readonly',
                module: 'readonly',
                process: 'readonly',
                console: 'readonly',
            },
        },
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-var-requires': 'off',
        },
    },
    {
        files: ['esbuild.config.js'],
        rules: { 'no-process-exit': 'off' },
    },
    {
        files: ['*.test.ts*', '*.mock.ts*'],
        rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
    },
    eslintPluginPrettierRecommended,
]);

/** @param config {import('eslint').Linter.FlatConfig} */
function defineConfig(config) {
    return config;
}
