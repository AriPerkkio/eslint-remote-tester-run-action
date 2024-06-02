import { beforeAll, afterEach, afterAll, vi } from 'vitest';

import GithubAPI from './__mocks__/GithubAPI.mock';

vi.mock('@actions/core', () => {
    return {
        getInput: vi
            .fn()
            .mockImplementation(key =>
                key === 'issue-label' ? undefined : `mock-${key}`
            ),
        info: vi.fn(),
    };
});

vi.mock('@actions/github', async importActual => {
    const actual = await importActual<typeof import('@actions/github')>();

    return {
        ...actual,
        context: { repo: { owner: 'mock-owner', repo: 'mock-repo' } },
    };
});

beforeAll(() => GithubAPI.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => GithubAPI.resetHandlers());
afterAll(() => GithubAPI.close());
