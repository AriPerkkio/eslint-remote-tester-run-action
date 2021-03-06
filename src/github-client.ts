import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';

let githubToken: string;
let issueTitle: string;

try {
    githubToken = core.getInput('github-token');
    issueTitle = core.getInput('issue-title', { required: true });
} catch (error) {
    core.setFailed(error.message);
}

/**
 * Client for handling `octokit` requests.
 * Provides easier API for response data.
 */
class GithubClient {
    private octokit: ReturnType<typeof getOctokit>;

    constructor() {
        this.octokit = getOctokit(githubToken);
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
        await this.octokit.issues.createComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: existingIssue,
            body,
        });
    }

    private async getExistingIssue(): Promise<number | undefined> {
        const response = await this.octokit.search.issuesAndPullRequests({
            sort: 'created',
            order: 'desc',
            q: [
                `${issueTitle} in:title`,
                'is:issue',
                'is:open',
                `repo:${context.repo.owner}/${context.repo.repo}`,
            ].join(' '),
        });

        const { items } = response.data;
        core.info(`Found ${items.length} open issues with title ${issueTitle}`);

        // In case of many matches use the latest issue
        const issue = items.find(a => a.title === issueTitle);
        return issue ? issue.number : undefined;
    }

    private async createIssue(body: string): Promise<void> {
        await this.octokit.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: issueTitle,
            body,
        });
    }
}

export default new GithubClient();
