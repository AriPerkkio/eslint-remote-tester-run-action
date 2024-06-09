import { describe, expect, test } from 'vitest';
import { Result } from 'eslint-remote-tester/dist/exports-for-compare-action';

import { createComment, createError } from '../src/comment-templates';
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

describe('createComment', () => {
    test('results are shown in details', async () => {
        const comment = await createComment(
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

    test('results are limited based on maxResultCount', async () => {
        const comment = await createComment(
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

    test("count of scanned repositories is not added when it's unavailable", async () => {
        const comment = await createComment(
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

    test('length of results are limited below 65K characters', async () => {
        const results = [
            generateResult(1),
            generateResult(2),
            generateResult(3),
        ].map(result => ({
            ...result,
            error: 'Extremely long stacktrace'.repeat(10000),
        }));

        const comment = await createComment(results, 3, 50);

        expect(comment.length).toBeLessThan(65000);
    });
});

describe('createError', () => {
    test('error stack is shown', () => {
        const comment = createError(mockError);

        expect(comment).toMatchInlineSnapshot(`
          "Something went wrong. This is likely an internal error of \`eslint-remote-tester-run-action\`.

          <details>
              <summary>Click to expand</summary>

          \`\`\`
          Error: mock error
              at <removed>/test/utils.ts:2:26
              at VitestExecutor.runModule (file://<removed>/node_modules/.pnpm/vite-node@1.6.0_@types+node@14.18.63/node_modules/vite-node/dist/client.mjs:362:11)
              at VitestExecutor.runModule (file://<removed>/node_modules/.pnpm/vitest@1.6.0_@types+node@14.18.63/node_modules/vitest/dist/vendor/execute.fL3szUAI.js:554:20)
              at VitestExecutor.directRequest (file://<removed>/node_modules/.pnpm/vite-node@1.6.0_@types+node@14.18.63/node_modules/vite-node/dist/client.mjs:346:16)
              at processTicksAndRejections (node:internal/process/task_queues:95:5)
              at VitestExecutor.cachedRequest (file://<removed>/node_modules/.pnpm/vite-node@1.6.0_@types+node@14.18.63/node_modules/vite-node/dist/client.mjs:189:14)
              at VitestExecutor.dependencyRequest (file://<removed>/node_modules/.pnpm/vite-node@1.6.0_@types+node@14.18.63/node_modules/vite-node/dist/client.mjs:233:12)
              at <removed>/test/comment-templates.test.ts:3:31
              at VitestExecutor.runModule (file://<removed>/node_modules/.pnpm/vite-node@1.6.0_@types+node@14.18.63/node_modules/vite-node/dist/client.mjs:362:5)
              at VitestExecutor.directRequest (file://<removed>/node_modules/.pnpm/vite-node@1.6.0_@types+node@14.18.63/node_modules/vite-node/dist/client.mjs:346:5)
          \`\`\`

          </details>
          "
        `);
    });
});
