import { Result } from 'eslint-remote-tester/dist/exports-for-compare-action';

import { COMMENT_TEMPLATE, ERROR_TEMPLATE } from '../src/comment-templates';
import { mockError } from './utils';

function generateResult(postfix: number): Result {
    return {
        repository: `repository-${postfix}`,
        repositoryOwner: `repositoryOwner-${postfix}`,
        rule: `rule-${postfix}`,
        message: `message-${postfix}`,
        path: `path-${postfix}`,
        link: `link-${postfix}`,
        extension: `extension-${postfix}`,
        source: `source-${postfix}`,
        error: `error-${postfix}`,
        __internalHash: `__internalHash-${postfix}` as Result['__internalHash'],
    };
}

describe('COMMENT_TEMPLATE', () => {
    test('results are shown in details', () => {
        const comment = COMMENT_TEMPLATE(
            [generateResult(1), generateResult(2)],
            152,
            10
        );

        expect(comment).toMatchInlineSnapshot(`
            "Detected 2 ESLint reports and/or crashes. 
            Scanned 152 repositories.

            Rules:
            -   \`rule-1\`
            -   \`rule-2\`

            <details>
                <summary>Click to expand</summary>

            ## Rule: rule-1

            -   Message: \`message-1\`
            -   Path: \`path-1\`
            -   [Link](link-1)

            \`\`\`extension-1
            source-1
            \`\`\`

            \`\`\`
            error-1
            \`\`\`

            ## Rule: rule-2

            -   Message: \`message-2\`
            -   Path: \`path-2\`
            -   [Link](link-2)

            \`\`\`extension-2
            source-2
            \`\`\`

            \`\`\`
            error-2
            \`\`\`

            </details>
            "
        `);
    });

    test('results are limited based on maxResultCount', () => {
        const comment = COMMENT_TEMPLATE(
            [generateResult(1), generateResult(2), generateResult(3)],
            1421,
            2
        );

        expect(comment).toMatchInlineSnapshot(`
            "Detected 3 ESLint reports and/or crashes. 
            Scanned 1421 repositories.

            Reached maximum result count 2.
            Showing 2/3

            Rules:
            -   \`rule-1\`
            -   \`rule-2\`
            -   \`rule-3\`

            <details>
                <summary>Click to expand</summary>

            ## Rule: rule-1

            -   Message: \`message-1\`
            -   Path: \`path-1\`
            -   [Link](link-1)

            \`\`\`extension-1
            source-1
            \`\`\`

            \`\`\`
            error-1
            \`\`\`

            ## Rule: rule-2

            -   Message: \`message-2\`
            -   Path: \`path-2\`
            -   [Link](link-2)

            \`\`\`extension-2
            source-2
            \`\`\`

            \`\`\`
            error-2
            \`\`\`

            </details>
            "
        `);
    });

    test("count of scanned repositories is not added when it's unavailable", () => {
        const comment = COMMENT_TEMPLATE(
            [generateResult(1), generateResult(2), generateResult(3)],
            undefined,
            2
        );

        expect(comment).toMatchInlineSnapshot(`
            "Detected 3 ESLint reports and/or crashes. 

            Reached maximum result count 2.
            Showing 2/3

            Rules:
            -   \`rule-1\`
            -   \`rule-2\`
            -   \`rule-3\`

            <details>
                <summary>Click to expand</summary>

            ## Rule: rule-1

            -   Message: \`message-1\`
            -   Path: \`path-1\`
            -   [Link](link-1)

            \`\`\`extension-1
            source-1
            \`\`\`

            \`\`\`
            error-1
            \`\`\`

            ## Rule: rule-2

            -   Message: \`message-2\`
            -   Path: \`path-2\`
            -   [Link](link-2)

            \`\`\`extension-2
            source-2
            \`\`\`

            \`\`\`
            error-2
            \`\`\`

            </details>
            "
        `);
    });

    test('length of results are limited below 65K characters', () => {
        const results = [
            generateResult(1),
            generateResult(2),
            generateResult(3),
        ].map(result => ({
            ...result,
            error: 'Extremely long stacktrace'.repeat(10000),
        }));

        const comment = COMMENT_TEMPLATE(results, 3, 50);

        expect(comment.length).toBeLessThan(65000);
    });
});

describe('ERROR_TEMPLATE', () => {
    test('error stack is shown', () => {
        const comment = ERROR_TEMPLATE(mockError);

        expect(comment).toMatchInlineSnapshot(`
            "Something went wrong. This is likely an internal error of \`eslint-remote-tester-run-action\`.

            <details>
                <summary>Click to expand</summary>

            \`\`\`
            Error: mock error
                at Object.<anonymous> (<removed>/test/utils.ts:2:26)
                at Runtime._execModule (<removed>/node_modules/.pnpm/jest-runtime@24.9.0/node_modules/jest-runtime/build/index.js:867:68)
                at Runtime._loadModule (<removed>/node_modules/.pnpm/jest-runtime@24.9.0/node_modules/jest-runtime/build/index.js:577:12)
                at Runtime.requireModule (<removed>/node_modules/.pnpm/jest-runtime@24.9.0/node_modules/jest-runtime/build/index.js:433:10)
                at Runtime.requireModuleOrMock (<removed>/node_modules/.pnpm/jest-runtime@24.9.0/node_modules/jest-runtime/build/index.js:598:21)
                at Object.<anonymous> (<removed>/test/comment-templates.test.ts:4:1)
                at Runtime._execModule (<removed>/node_modules/.pnpm/jest-runtime@24.9.0/node_modules/jest-runtime/build/index.js:867:68)
                at Runtime._loadModule (<removed>/node_modules/.pnpm/jest-runtime@24.9.0/node_modules/jest-runtime/build/index.js:577:12)
                at Runtime.requireModule (<removed>/node_modules/.pnpm/jest-runtime@24.9.0/node_modules/jest-runtime/build/index.js:433:10)
                at <removed>/node_modules/.pnpm/jest-jasmine2@24.9.0/node_modules/jest-jasmine2/build/index.js:202:13
            \`\`\`

            </details>
            "
        `);
    });
});
