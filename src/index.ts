import fs from 'fs';
import * as core from '@actions/core';
import { exec } from '@actions/exec';

import GithubClient from './github-client';
import runTester, { RESULTS_TMP } from './run-tester';
import { COMMENT_TEMPLATE, ERROR_TEMPLATE } from './comment-templates';
import { Result } from 'eslint-remote-tester/dist/exports-for-compare-action';

async function run() {
    try {
        const repositoryInitializeCommand = core.getInput(
            'repository-initialize-command',
            { required: true }
        );
        const eslintRemoteTesterConfig = core.getInput(
            'eslint-remote-tester-config',
            { required: true }
        );
        const maxResultCount = core.getInput('max-result-count', {
            required: true,
        });

        await core.group('Initializing repository', async () => {
            for (const command of repositoryInitializeCommand.split('\n')) {
                await exec(command);
            }
        });

        await core.group('Running eslint-remote-tester', () =>
            runTester(eslintRemoteTesterConfig)
        );

        await core.group('Posting results', async () => {
            const comparisonResults = fs.readFileSync(RESULTS_TMP, 'utf8');
            const results: Result[] = JSON.parse(comparisonResults);

            if (results.length === 0) {
                return core.info('Skipping result posting due to 0 results');
            }

            const resultsComment = COMMENT_TEMPLATE(
                results,
                parseInt(maxResultCount)
            );

            await GithubClient.postResults(resultsComment);
        });
    } catch (error) {
        core.setFailed(error.message);
        await GithubClient.postResults(ERROR_TEMPLATE(error));
    }
}

export const __handleForTests = run();
