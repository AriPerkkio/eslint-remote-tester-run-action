import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const API_URL = 'https://api.github.com';
export const mockNoExistingIssues = jest.fn().mockReturnValue(false);
export const mockApiError = jest.fn().mockReturnValue(false);
export const onComment = jest.fn();
export const onIssueCreated = jest.fn();
export const expectedIssueNumber = 999;

export default setupServer(
    rest.get(`${API_URL}/search/issues`, (req, res, ctx) => {
        const q = req.url.searchParams.get('q');
        const sort = req.url.searchParams.get('sort');
        const order = req.url.searchParams.get('order');

        const [title, inTitle, isIssue, isOpen, repo] = decodeURIComponent(
            q!
        ).split(' ');

        // Expected query
        if (
            inTitle !== 'in:title' ||
            isIssue !== 'is:issue' ||
            isOpen !== 'is:open' ||
            repo !== 'repo:mock-owner/mock-repo' ||
            sort !== 'created' ||
            order !== 'desc'
        ) {
            return res(ctx.status(404));
        }

        if (mockApiError()) {
            return res(ctx.status(500));
        }

        return res(
            ctx.json({
                // Use mockNoExistingIssues to temporarily simulate "No issues" -case
                items: mockNoExistingIssues()
                    ? []
                    : [
                          { title: 'Should not match', number: 1 },
                          { title, number: expectedIssueNumber },
                      ],
            })
        );
    }),
    rest.post(
        `${API_URL}/repos/:owner/:repo/issues/:issueNumber/comments`,
        (req, res, ctx) => {
            const { owner, repo, issueNumber } = req.params;
            const body = req.body;

            // Void endpoint tested via additional assertion
            onComment({ owner, repo, issueNumber, body });

            return res(ctx.json({}));
        }
    ),
    rest.post(`${API_URL}/repos/:owner/:repo/issues`, (req, res, ctx) => {
        const { owner, repo, title } = req.params;
        const body = req.body;

        // Void endpoint tested via additional assertion
        onIssueCreated({ owner, repo, title, body });

        return res(ctx.json({}));
    })
);
