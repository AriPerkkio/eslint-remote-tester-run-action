import fs from 'fs';
import { resolve } from 'path';
import { exec } from '@actions/exec';

import runTester from '../src/run-tester';
import { ESLINT_REMOTE_TESTER_BIN } from '../src/peer-dependencies';
import { sanitizeStackTrace } from './utils';
import { Config } from 'eslint-remote-tester/dist/exports-for-compare-action';

const EXPECTED_RUN_CONFIG = './eslint-remote-tester-runner-internal.config.js';
const CONFIG = './test/eslint-remote-tester.config.js';
const INVALID_CONFIG = './test/eslint-remote-tester.invalid.config.js';
const CONFIG_WITH_ON_COMPLETE =
    './test/eslint-remote-tester.config.onComplete.js';

jest.mock('@actions/exec', () => ({ exec: jest.fn() }));

function readRunConfig() {
    let content: Config;

    jest.isolateModules(() => {
        content = require(resolve(EXPECTED_RUN_CONFIG));
    });

    return content!;
}

function cleanup() {
    jest.resetModules();

    if (fs.existsSync(EXPECTED_RUN_CONFIG)) {
        fs.unlinkSync(EXPECTED_RUN_CONFIG);
    }
}

describe('run-tester', () => {
    beforeEach(cleanup);
    afterEach(cleanup);

    test('runs eslint-remote-tester with provided configuration', async () => {
        await runTester(CONFIG);

        expect(exec).toHaveBeenCalledWith(
            `${ESLINT_REMOTE_TESTER_BIN} --config ${EXPECTED_RUN_CONFIG}`,
            [],
            {
                ignoreReturnCode: true,
                env: expect.objectContaining({
                    NODE_OPTIONS: '--max_old_space_size=5120',
                }),
            }
        );
    });

    test('throws if given configuration does not exist', () => {
        return expect(runTester('./non-existing-config')).rejects.toThrowError(
            /(?=.*Unable to find eslint-remote-tester config with path)(?=.*non-existing-config)/
        );
    });

    test('uses onComplete from users configuration', async () => {
        await runTester(CONFIG_WITH_ON_COMPLETE);

        expect(sanitizeStackTrace(readRunConfig().onComplete!.toString()))
            .toMatchInlineSnapshot(`
            "async function onComplete(results, comparisonResults, repositoryCount) {
                    // Write results to cache
                    fs.writeFileSync('/tmp/results.json', JSON.stringify({ results, repositoryCount }));

                    if(usersConfig.onComplete) {
                        await usersConfig.onComplete(results, comparisonResults, repositoryCount);
                    }
                }"
        `);
    });

    test('cache is disabled by default', async () => {
        await runTester(CONFIG);

        expect(readRunConfig().cache).toBe(false);
    });

    test('CI is enabled by default', async () => {
        await runTester(CONFIG);

        expect(readRunConfig().CI).toBe(true);
    });

    test('configuration is validated', () => {
        const consolelog = console.log;
        console.log = jest.fn();

        return expect(runTester(INVALID_CONFIG))
            .rejects.toThrowErrorMatchingInlineSnapshot(
                `
"Configuration validation errors:
- Missing repositories."
`
            )
            .then(() => (console.log = consolelog));
    });
});
