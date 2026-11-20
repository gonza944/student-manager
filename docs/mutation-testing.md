# Mutation testing

Stryker 10 runs the existing `npm run test:unit` command through its command
runner. It does not start Next.js or execute the Playwright suite. Install with
`npm ci` using the Node version in `.nvmrc`.

- `npx stryker run` or `npm run mutation`: mutate configured production source
  under `app/`, `components/`, and `lib/`.
- `npm run mutation:incremental`: retain incremental reports while forcing
  execution. The command runner cannot detect changed tests, so cached results
  alone would not validate a test-only fix.
- `npm run mutation:diff -- origin/master`: mutate committed changed production
  files against the supplied review base. With no argument, use the local
  `origin/HEAD` default-branch reference. Fetch the intended base beforehand;
  the helper does not fetch it automatically.
- `npx stryker run --mutate app/students/utils/to-minor-units.ts`: a small smoke
  run before starting a full baseline.

The diff helper requires a clean working tree because its Git comparison excludes
staged, unstaged, and untracked changes. It preserves whitespace/newlines in paths,
excludes tests, declaration files, fixture/generated/migration directories and
index barrels, and rejects filenames that cannot be passed as exact Stryker
patterns. It launches the installed local CLI without a shell or downloads.

Reports and cache are written to ignored `reports/mutation/`; HTML opens at
`reports/mutation/index.html`. Temporary sandboxes under `.stryker-tmp/` are also
ignored. There is no failing score threshold until a meaningful baseline exists.

The command runner executes the entire unit suite for each mutant, with four
workers. Coverage analysis is off: it cannot distinguish uncovered code from
covered code with weak assertions. UI and server behavior absent from the Node
suite can therefore produce survivors; a mutation score does not establish
browser coverage. Classify survivors and test observable behavior before raising
thresholds. Scoped runs override the configured mutation patterns; choose
production files explicitly. Incremental reports may also retain mutants from
previous scopes; distinguish those historical entries from the files actually
executed by the current run.

References: [Stryker configuration](https://stryker-mutator.io/docs/stryker-js/configuration/)
and [incremental limitations](https://stryker-mutator.io/docs/stryker-js/incremental/).
