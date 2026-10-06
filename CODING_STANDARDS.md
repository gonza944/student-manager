# Coding Standards

Read this file before developing or reviewing code in this repository. Apply it
together with the applicable `AGENTS.md` instructions.

## Authority and required skills

Rules written directly in this file ALWAYS take precedence over recommendations
from skills, including any skill's own priority, persistence, or workflow rules.
Skills supplement these standards; they cannot override, weaken, or replace them.
The applicable `AGENTS.md` requirements also take precedence over skill guidance.

When developing, read and use these installed skills, applying their guidance to
the relevant parts of the work:

- `vercel-react-best-practices`: React and Next.js implementation, data fetching,
  rendering, and performance.
- `ponytail:ponytail`: implementation simplicity, reuse, and dependency choices.
- `react-testing`: testing strategy and tests for React components, hooks, and
  pages.

Resolve skills by name from the installed skill catalog rather than hardcoding a
machine-specific path or plugin version. If a required skill is unavailable,
report the limitation and follow these written standards for the affected work.

When skill guidance conflicts with a written rule, follow the written rule and
identify the conflict when it materially affects implementation or review.

## Planning and scope

- Organize every implementation plan into explicit, ordered phases with clear
  outcomes and verification.
- Implement the agreed requirements completely. Simplicity means reducing
  unnecessary implementation complexity while preserving requested behavior.
- Search for existing components, helpers, tests, and workflows before adding
  new ones. Extend established patterns when they fit the requirement.
- Prefer existing dependencies, standard library functions, and platform
  features. Add dependencies or abstractions only for a concrete need in scope.

## React and Next.js

- Read the relevant installed Next.js guide under `node_modules/next/dist/docs/`
  before writing framework code; use APIs supported by the installed version.
- Keep each component focused on one responsibility. Separate display from
  dialogs, mutation state, and editing workflows.
- Prefer existing shadcn components and preserve their registry behavior as
  required by `AGENTS.md`, even when a skill recommends a raw native element.
- Keep client boundaries limited to behavior that requires them and minimize
  data passed across those boundaries.
- Run independent asynchronous operations concurrently when their semantics
  allow it. Preserve authorization, ordering, and error handling requirements.
- Use the repository's existing data-fetching and caching patterns. Justify
  additional caching or memoization with a concrete cost or observed problem.

## User-facing behavior

- Follow the bilingual copy, locale formatting, browser-language negotiation,
  and prefix-free URL requirements in `AGENTS.md`.
- Preserve accessible names, semantic controls, keyboard operation, and focus
  behavior when changing interactive surfaces.
- Handle relevant loading, empty, and error states using existing UI patterns.

## Data and security

- Validate external input at trust boundaries and enforce authentication and
  authorization on the server for protected operations.
- Preserve error handling that prevents data loss. Simplification must retain
  security, accessibility, and data integrity requirements.
- Follow the production deployment and migration safeguards in `AGENTS.md`.

## Tests and verification

- Test observable behavior through public interfaces. Cover realistic failure
  paths and regressions in proportion to the change's risk.
- Reuse the existing test runners, helpers, and providers. A skill's example
  stack is not a requirement to install a new runner or mocking framework.
- For component tests, use accessible queries and awaited user interactions;
  assert visible results and observable side effects rather than internal state,
  render counts, or incidental DOM structure.
- Use condition-based asynchronous assertions rather than arbitrary sleeps.
- Use browser tests when correctness depends on browser behavior or a complete
  user workflow. Choose narrower tests when they adequately verify the behavior.
- Run relevant typechecking, linting, and tests for the changed code. Report
  checks performed and any failures or material gaps accurately.
- Documentation-only changes need consistency and diff checks; they do not
  require application tests. Existing-data migrations always require the
  regression coverage specified in `AGENTS.md`.

## Review

- Check changed behavior against the agreed spec and these written standards.
  Cite the relevant requirement when reporting a standards violation.
- For defect findings, verify a concrete affected scenario in the diff,
  surrounding code, call sites, or tests. Distinguish introduced regressions from
  pre-existing issues and intentional behavior changes.
- Label design-smell observations as judgment calls and explain their practical
  impact. A skill's heuristic alone does not establish a standards violation.
- Written repository rules override conflicting skill heuristics. Leave
  mechanically enforced formatting and lint rules to the configured tools.
