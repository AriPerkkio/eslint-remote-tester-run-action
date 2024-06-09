import type { Config } from 'eslint-remote-tester';

// @ts-expect-error -- untyped
import js from '@eslint/js';

const config: Config = {
    repositories: ['AriPerkkio/eslint-remote-tester-integration-test-target'],
    extensions: ['.ts'],
    eslintConfig: [js.configs.recommended] as any,
};

export default config;
