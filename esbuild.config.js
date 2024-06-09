import esbuild from 'esbuild';

/** @type {import('esbuild/lib/main').BuildOptions} */
const options = {
    entryPoints: ['./src/index.ts'],
    bundle: true,
    external: [
        // Do not bundle eslint-remote-tester. Its modules should be required
        // runtime from users eslint-remote-tester in order to avoid updating action.
        'eslint-remote-tester',

        // Externalize node built-ins
        'diagnostics_channel',
        'node:stream',
        'node:util',
        'node:events',
        'node:fs',
        'node:path',
    ],
    platform: 'node',
    format: 'esm',
    outdir: 'dist',
    outbase: 'src',
    outExtension: { '.js': '.mjs' },

    banner: {
        js: [
            `import { createRequire as topLevelCreateRequire } from 'module'`,
            `const require = topLevelCreateRequire(import.meta.url)`,
        ].join('\n'),
    },
};

esbuild.build(options).catch(err => {
    process.stderr.write(err.stderr);
    process.exit(1);
});
