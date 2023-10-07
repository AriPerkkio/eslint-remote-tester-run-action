import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';

let githubToken: string;
let issueTitle: string;
let issueLabel: string | undefined;

try {
    githubToken = core.getInput('github-token');
    issueTitle = core.getInput('issue-title', { required: true });
    issueLabel = core.getInput('issue-label');
} catch (error) {
    core.setFailed(error.message);
}

/**
 * Client for handling `octokit` requests.
 * Provides easier API for response data.
 */
class GithubClient {
    private octokit: ReturnType<typeof getOctokit>;

    /** Indicates how many times failed request is retried */
    private MAX_RETRIES = 30;

    /** Indicates how many seconds should be waited before failed request is retried */
    private RETRY_SEEP_TIME_MS = 10000;

    constructor() {
        this.octokit = getOctokit(githubToken);
    }

    private async requestAndRetry<T>(request: () => Promise<T>): Promise<T> {
        for (let retryCount = 1; retryCount <= this.MAX_RETRIES; retryCount++) {
            try {
                return await request();
            } catch (error) {
                core.info(
                    `Request failed. Retrying ${retryCount}/${this.MAX_RETRIES}.`
                );
                await sleep(this.RETRY_SEEP_TIME_MS);
            }
        }

        return await request();
    }

    /**
     * Post results to existing issue as comment or create new issue using
     * results as body
     */
    async postResults(body: string): Promise<void> {
        const existingIssue = await this.getExistingIssue();

        if (existingIssue === undefined) {
            core.info('No existing issue found. Creating new one.');
            return this.createIssue(body);
        }

        core.info(`Reusing existing issue #${existingIssue}`);

        await this.requestAndRetry(() =>
            this.octokit.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: existingIssue,
                body,
            })
        );
    }

    private async getExistingIssue(): Promise<number | undefined> {
        // Look for existing issues based on issue label if present. Otherwise use issue title
        const query = issueLabel
            ? `label:"${issueLabel}"`
            : `${issueTitle} in:title`;

        const response = await this.requestAndRetry(() =>
            this.octokit.search.issuesAndPullRequests({
                sort: 'created',
                order: 'desc',
                q: [
                    query,
                    'is:issue',
                    'is:open',
                    `repo:${context.repo.owner}/${context.repo.repo}`,
                ].join(' '),
            })
        );

        const { items } = response.data;
        core.info(`Found ${items.length} open issues matcing query (${query})`);

        // In case of many matches use the latest issue
        const issue = items[0];
        return issue ? issue.number : undefined;
    }

    private async createIssue(body: string): Promise<void> {
        await this.requestAndRetry(() =>
            this.octokit.issues.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                title: issueTitle,
                labels: issueLabel ? [issueLabel] : undefined,
                body,
            })
        );
    }
}

async function sleep(timeMs: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, timeMs));
}

export default new GithubClient();
