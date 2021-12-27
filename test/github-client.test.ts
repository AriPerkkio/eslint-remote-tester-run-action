import GithubClient from '../src/github-client';
import {
    onComment,
    onIssueCreated,
    mockNoExistingIssues,
    expectedIssueNumber,
    mockApiError,
} from './__mocks__/GithubAPI.mock';

const body = 'mock-comment-body';

function times(count: number) {
    return function wrapper(method: () => void) {
        Array(Math.floor(count))
            .fill(null)
            .forEach(() => method());
    };
}

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

    test('should recover from 5x API errors', async () => {
        // Request should fail 5 times
        times(5)(() => mockApiError.mockReturnValueOnce(true));

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
    });

    test('should fail request after 6x failures', async () => {
        times(6)(() => mockApiError.mockReturnValueOnce(true));
        mockNoExistingIssues.mockReturnValueOnce(true);

        await expect(
            GithubClient.postResults(body)
        ).rejects.toMatchInlineSnapshot(`[HttpError]`);
    });
});
