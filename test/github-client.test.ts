import GithubClient from '../src/github-client';
import {
    onComment,
    onIssueCreated,
    mockNoExistingIssues,
    expectedIssueNumber,
} from './__mocks__/GithubAPI.mock';

const body = 'mock-comment-body';

describe('github-client', () => {
    beforeEach(() => {
        onIssueCreated.mockClear();
        onComment.mockClear();
    });

    test('postResults creates new issue when no matching issue exists', async () => {
        mockNoExistingIssues.mockReturnValueOnce(true);
        await GithubClient.postResults(body);

        expect(onIssueCreated).toHaveBeenCalledWith({
            owner: 'mock-owner',
            repo: 'mock-repo',
            body: {
                body,
                title: 'mock-issue-title',
            },
        });
        expect(onComment).not.toHaveBeenCalled();
    });

    test('postResults adds comment to existing issue', async () => {
        await GithubClient.postResults(body);

        expect(onComment).toHaveBeenCalledWith({
            owner: 'mock-owner',
            repo: 'mock-repo',
            body: { body },
            issueNumber: expectedIssueNumber.toString(),
        });
        expect(onIssueCreated).not.toHaveBeenCalled();
    });
});
