# eslint-remote-tester-run-action

> Github action for running eslint-remote-tester and receiving results in Github issue

[Requirements](#requirements) | [Configuration](#configuration) | [Publishing new release](#publishing-new-release)

`eslint-remote-tester-run-action` is a pre-configured Github workflow action for running [`eslint-remote-tester`](https://github.com/AriPerkkio/eslint-remote-tester).
It runs `eslint-remote-tester` and posts results in Github issue. Results are commented on existing open issue if present.

Check out the use case description from eslint-remote-tester's documentation: [Plugin maintainer making sure all existing rules do not crash](https://github.com/AriPerkkio/eslint-remote-tester#plugin-maintainer-making-sure-all-existing-rules-do-not-crash).

<p align="center">
  <img width="640" src="https://raw.githubusercontent.com/AriPerkkio/eslint-remote-tester-run-action/HEAD/docs/demo.png">
</p>

## Requirements

`eslint-remote-tester` is required as peer dependency.

| eslint-remote-tester-run-action | eslint-remote-tester |
| :-----------------------------: | :------------------: |
|              `v1`               |   `1.0.1` or above   |

## Configuration:

Create new workflow `.github/workflows/smoke-test.yml`.

```yml
name: Smoke test

on:
    workflow_dispatch: # Manual trigger
    schedule: # Every thursday at 00:00
        - cron: '0 00 * * THU'

jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2
            - uses: actions/setup-node@v2
              with:
                  node-version: 14
            - run: npm install
            - run: npm link
            - run: npm link eslint-plugin-custom
            - uses: AriPerkkio/eslint-remote-tester-run-action@v1
              with:
                  issue-title: 'Results of weekly scheduled smoke test'
                  max-result-count: 100
                  eslint-remote-tester-config: test/smoke/eslint-remote-tester.config.js
```

### Action parameters

| Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Description                                                                                                                                                                      | Required |                    Default                     | Example                                    |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | :--------------------------------------------: | :----------------------------------------- |
| `github-token`                                                                                                                                                                           | Token for Github Authentication. See [About the `GITHUB_TOKEN` secret](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#about-the-github_token-secret). |   :x:    |              `${{github.token}}`               | `${{secrets.SOME_CUSTOM_TOKEN}}`           |
| `issue-title`                                                                                                                                                                            | Title of issue created for reporting results                                                                                                                                     |   :x:    | `'Results of eslint-remote-tester-run-action'` | `'Results of weekly scheduled smoke test'` |
| `eslint-remote-tester-config`                                                                                                                                                            | Path to project's `eslint-remote-tester.config.js`                                                                                                                               |   :x:    |       `'eslint-remote-tester.config.js'`       | `./path/to/custom.config.js`               |
| `max-result-count`                                                                                                                                                                       | Maximum result count to be posted in result comment.                                                                                                                             |   :x:    |                      `50`                      | `100`                                      |
| `working-directory`                                                                                                                                                                      | The working directory where action is run                                                                                                                                        |   :x:    |                      :x:                       | `./ci`                                     |

## Publishing new release

Follow guidelines from [actions/toolkit: action-versioning](https://github.com/actions/toolkit/blob/main/docs/action-versioning.md#recommendations).

Make sure to manually update git tag for patch and fix versions.

> 3. **Make the new release available to those binding to the major version tag**: Move the major version tag (v1, v2, etc.) to point to the ref of the current release. This will > act as the stable release for that major version. You should keep this tag updated to the most recent stable minor/patch release.
>
> ```
> git tag -fa v1 -m "Update v1 tag"
> git push origin v1 --force
> ```
