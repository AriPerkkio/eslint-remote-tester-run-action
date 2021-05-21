import { Result } from 'eslint-remote-tester/dist/exports-for-compare-action';
import { requirePeerDependency } from './peer-dependencies';

// prettier-ignore
/**
 * Template for building github issue comment when action run into error
 */
export const ERROR_TEMPLATE = (error: Error): string =>
`Something went wrong.

<details>
    <summary>Click to expand</summary>

\`\`\`
${error.stack}
\`\`\`

</details>
`;

/**
 * Template used to build github issue comment for successful action run
 */
export const COMMENT_TEMPLATE = (
    results: Result[],
    repositoryCount: number | undefined,
    maxResultCount: number
): string => {
    const { RESULT_PARSER_TO_COMPARE_TEMPLATE } = requirePeerDependency(
        'eslint-remote-tester'
    );
    const template = RESULT_PARSER_TO_COMPARE_TEMPLATE.markdown.results;

    const limitReached = results.length > maxResultCount;
    const limitedResults = results.slice(0, maxResultCount);

    // prettier-ignore
    return '' +
`Detected ${results.length} ESLint reports and/or crashes. ${repositoryCount ? `
Scanned ${repositoryCount} repositories.` : ''}
${limitReached ?
`
Reached maximum result count ${maxResultCount}.
Showing ${limitedResults.length}/${results.length}
` : ''}
<details>
    <summary>Click to expand</summary>

${limitedResults.map(template).join('\n')}
</details>
`;
};
