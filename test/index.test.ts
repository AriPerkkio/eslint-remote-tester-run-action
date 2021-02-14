const mockGithub = jest.fn();
jest.mock('@actions/github', () => mockGithub());

const mockCore = {
    setFailed: jest.fn(),
    info: jest.fn(),
    group: async (label: string, method: () => Promise<void>) => method(),
    getInput: jest
        .fn()
        .mockImplementation(key =>
            key === 'max-result-count' ? '999' : `mock-${key}`
        ),
};
jest.mock('@actions/core', () => mockCore);

const mockFs = {
    readFileSync: jest.fn().mockReturnValue('[{"id": 1}, {"id": 2}]'),
};
jest.mock('fs', () => mockFs);

const mockGithubClient = { postResults: jest.fn() };
jest.mock('../src/github-client', () => ({
    __esModule: true,
    default: mockGithubClient,
}));

const mockRunTester = jest.fn();
jest.mock('../src/run-tester', () => mockRunTester);

const mockCommentTemplate = jest.fn().mockReturnValue('mock-comment-template');
const mockErrorTemplate = jest.fn().mockReturnValue('mock-error-template');
jest.mock('../src/comment-templates', () => ({
    COMMENT_TEMPLATE: mockCommentTemplate,
    ERROR_TEMPLATE: mockErrorTemplate,
}));

process.chdir = jest.fn();

async function runEntryPoint() {
    jest.resetModules();
    return require('../src/index').__handleForTests;
}

describe('entrypoint', () => {
    beforeEach(() => {
        mockCore.setFailed.mockClear();
        mockGithubClient.postResults.mockClear();
        mockGithubClient.postResults.mockResolvedValue(undefined);
    });

    test('calls run-tester with given configuration', async () => {
        await runEntryPoint();

        expect(mockRunTester).toHaveBeenCalledWith(
            'mock-eslint-remote-tester-config'
        );
    });

    test('sets working-directory', async () => {
        (process.chdir as jest.Mock).mockClear();

        await runEntryPoint();

        expect(process.chdir).toHaveBeenCalledWith(
            process.cwd() + '/mock-working-directory'
        );
    });

    test('calls GithubClient with formatted results', async () => {
        await runEntryPoint();

        expect(mockGithubClient.postResults).toHaveBeenCalledWith(
            'mock-comment-template'
        );
        expect(mockCommentTemplate).toHaveBeenCalledWith(
            [{ id: 1 }, { id: 2 }],
            999
        );
    });

    test('calls GithubClient with formatted error when error occurs', async () => {
        const error = new Error('mock-error');
        mockRunTester.mockRejectedValueOnce(error);
        await runEntryPoint();

        expect(mockGithubClient.postResults).toHaveBeenCalledWith(
            'mock-error-template'
        );
        expect(mockErrorTemplate).toHaveBeenCalledWith(error);
        expect(mockCore.setFailed).toHaveBeenCalledWith('mock-error');
    });

    test('skips result posting when there are 0 results', async () => {
        mockFs.readFileSync.mockReturnValueOnce('[]');
        await runEntryPoint();

        expect(mockGithubClient.postResults).not.toHaveBeenCalled();
        expect(mockCore.info).toHaveBeenCalledWith(
            'Skipping result posting due to 0 results'
        );
    });
});
