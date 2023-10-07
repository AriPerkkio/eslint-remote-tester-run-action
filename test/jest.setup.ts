import GithubAPI from './__mocks__/GithubAPI.mock';

jest.mock('@actions/core', () => ({
    getInput: jest
        .fn()
        .mockImplementation(key =>
            key === 'issue-label' ? undefined : `mock-${key}`
        ),
    info: jest.fn(),
}));

jest.mock(
    '@actions/github',
    jest.fn().mockImplementation(() => ({
        context: { repo: { owner: 'mock-owner', repo: 'mock-repo' } },
        getOctokit: jest.requireActual('@actions/github').getOctokit,
    }))
);

beforeAll(() => GithubAPI.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => GithubAPI.resetHandlers());
afterAll(() => GithubAPI.close());
