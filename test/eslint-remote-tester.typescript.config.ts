import type { Config } from 'eslint-remote-tester';

const config: Config = {
    repositories: ['AriPerkkio/eslint-remote-tester-integration-test-target'],
    extensions: ['.ts'],
    eslintrc: {
        root: true,
        extends: ['eslint:recommended'],
    },
};

export default config;
