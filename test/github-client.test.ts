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

async function waitFor(isDone: () => boolean | void): Promise<void> {
    try {
        if (isDone() !== false) return;
    } catch (_) {
        // Simply ignore error
    }

    await new Promise(resolve => setImmediate(resolve));
    jest.runOnlyPendingTimers();

    return waitFor(isDone);
}

describe('github-client', () => {
    beforeEach(() => {
        onIssueCreated.mockClear();
        onComment.mockClear();
        mockApiError.mockClear();
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

    test('should recover from 30x API errors', async () => {
        // Request should fail 30 times
        times(30)(() => mockApiError.mockReturnValueOnce(true));
        mockNoExistingIssues.mockReturnValueOnce(true);

        jest.useFakeTimers();
        GithubClient.postResults(body);

        await waitFor(() => expect(onIssueCreated).toHaveBeenCalled());
        jest.useRealTimers();

        expect(onIssueCreated).toHaveBeenCalledWith({
            owner: 'mock-owner',
            repo: 'mock-repo',
            body: {
                body,
                title: 'mock-issue-title',
            },
        });
    });

    test('should fail request after 31x failures', async () => {
        times(31)(() => mockApiError.mockReturnValueOnce(true));
        mockNoExistingIssues.mockReturnValueOnce(true);

        jest.useFakeTimers();
        const request = GithubClient.postResults(body);

        await waitFor(() => expect(mockApiError).toHaveBeenCalledTimes(31));
        jest.useRealTimers();

        await expect(request).rejects.toMatchInlineSnapshot(`[HttpError]`);
    });
});
