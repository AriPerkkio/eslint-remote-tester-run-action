import fs from 'fs';
import { exec } from '@actions/exec';

import runTester from '../src/run-tester';
import { ESLINT_REMOTE_TESTER_BIN } from '../src/peer-dependencies';
import { sanitizeStackTrace } from './utils';

const EXPECTED_RUN_CONFIG = './eslint-remote-tester-compare-internal.config.js';
const CONFIG = './test/eslint-remote-tester.config.js';
const INVALID_CONFIG = './test/eslint-remote-tester.invalid.config.js';
const CONFIG_WITH_ON_COMPLETE =
    './test/eslint-remote-tester.config.onComplete.js';

jest.mock('@actions/exec', () => ({ exec: jest.fn() }));

function readRunConfig() {
    const content = fs.readFileSync(EXPECTED_RUN_CONFIG, 'utf8');

    // require doesn't work here even when combined with jest.resetModules
    return eval(content);
}

function cleanup() {
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
        return expect(() =>
            runTester('./non-existing-config')
        ).rejects.toThrowError(
            /(?=.*Unable to find eslint-remote-tester config with path)(?=.*non-existing-config)/
        );
    });

    test('onComplete is valid if users configuration contains no onComplete', async () => {
        await runTester(CONFIG);

        expect(sanitizeStackTrace(readRunConfig().onComplete.toString()))
            .toMatchInlineSnapshot(`
            "async function onComplete(results, comparisonResults) {
                    fs.writeFileSync('/tmp/results.json', JSON.stringify(results || []));

                    // User provided onComplete is injected here if present
                    // No onComplete detected
                }"
        `);
    });

    test('uses onComplete from users configuration', async () => {
        await runTester(CONFIG_WITH_ON_COMPLETE);

        expect(sanitizeStackTrace(readRunConfig().onComplete.toString()))
            .toMatchInlineSnapshot(`
            "async function onComplete(results, comparisonResults) {
                    fs.writeFileSync('/tmp/results.json', JSON.stringify(results || []));

                    // User provided onComplete is injected here if present
                    await require('<removed>/test/eslint-remote-tester.config.onComplete.js').onComplete(results, comparisonResults);
                }"
        `);
    });

    test('configuration is validated', () => {
        const consolelog = console.log;
        console.log = jest.fn();

        return expect(() => runTester(INVALID_CONFIG))
            .rejects.toThrowErrorMatchingInlineSnapshot(
                `
                    "Configuration validation errors:
                    - Missing repositories."
                `
            )
            .then(() => (console.log = consolelog));
    });
});
