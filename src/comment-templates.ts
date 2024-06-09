import type { Result } from 'eslint-remote-tester/dist/exports-for-compare-action';
import { importPeerDependency } from './peer-dependencies';

// Github API limits body length to 65536. Let's leave some paddings just to be sure.
const RESULTS_MAX_LENGH = 62000;

const filterUniqueTruthy = <T>(item: T, index: number, array: T[]) =>
    item != null && array.indexOf(item) === index;

const formatRule = (rule: string | null) => '\n-   `' + rule + '`';

/**
 * Template for building github issue comment when action run into error
 */
export function createError(error: Error) {
    // prettier-ignore
    return '' +
`Something went wrong. This is likely an internal error of \`eslint-remote-tester-run-action\`.

<details>
    <summary>Click to expand</summary>

\`\`\`
${error.stack}
\`\`\`

</details>
`;
}

/**
 * Template used to build github issue comment for successful action run
 */
export async function createComment(
    results: Result[],
    repositoryCount: number | undefined,
    maxResultCount: number
) {
    const { RESULT_PARSER_TO_COMPARE_TEMPLATE } = await importPeerDependency(
        'eslint-remote-tester'
    );
    const template = RESULT_PARSER_TO_COMPARE_TEMPLATE.markdown.results;

    const limitReached = results.length > maxResultCount;
    const limitedResults = results.slice(0, maxResultCount);

    const rules = results.map(result => result.rule).filter(filterUniqueTruthy);

    // prettier-ignore
    return '' +
`Detected ${results.length} ESLint reports and/or crashes. ${repositoryCount ? `
Scanned ${repositoryCount} repositories.` : ''}
${limitReached ?
`
Reached maximum result count ${maxResultCount}.
Showing ${limitedResults.length}/${results.length}
` : ''}
Rules:${rules.filter(Boolean).map(formatRule).join('')}

<details>
    <summary>Click to expand</summary>

${limitedResults.map(template).join('\n').slice(0, RESULTS_MAX_LENGH)}
</details>
`;
}
