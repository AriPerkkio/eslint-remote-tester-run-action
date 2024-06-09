import fs from 'node:fs';
import path from 'node:path';
import * as core from '@actions/core';

import GithubClient from './github-client';
import runTester, { RESULTS_TMP } from './run-tester';
import { createComment, createError } from './comment-templates';
import { Result } from 'eslint-remote-tester/dist/exports-for-compare-action';

type TestResults = {
    results: Result[] | undefined;
    repositoryCount: number | undefined;
};

export default async function run() {
    try {
        const eslintRemoteTesterConfig = core.getInput(
            'eslint-remote-tester-config',
            { required: true }
        );
        const maxResultCount = core.getInput('max-result-count');

        const workingDirectory = core.getInput('working-directory');
        if (workingDirectory) {
            process.chdir(path.join(process.cwd(), workingDirectory));
        }

        await core.group('Running eslint-remote-tester', () =>
            runTester(eslintRemoteTesterConfig)
        );

        const resultCount = await core.group('Posting results', async () => {
            const testResults: TestResults = JSON.parse(
                // TODO: Handle cases where temp file doesn't exists, e.g. scan was erroneous
                fs.readFileSync(RESULTS_TMP, 'utf8')
            );

            core.info(`Scanned ${testResults.repositoryCount} repositories`);

            const results = testResults.results || [];

            if (results.length === 0) {
                core.info('Skipping result posting due to 0 results');
                return results.length;
            }

            const resultsComment = await createComment(
                results,
                testResults.repositoryCount,
                parseInt(maxResultCount)
            );

            await GithubClient.postResults(resultsComment);
            return results.length;
        });

        if (resultCount > 0) {
            core.setFailed(`Found ${resultCount} results`);
        }
    } catch (error) {
        core.setFailed(error.message);
        await GithubClient.postResults(createError(error));
    }
}
