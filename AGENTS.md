<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Internationalization is a default requirement

- Treat every new or changed user-facing surface as bilingual (`es` and `en`) unless explicitly scoped otherwise.
- Do not hardcode interface copy, metadata, accessibility labels, validation, or empty/error messages. Add semantic `next-intl` keys to both files in `messages/`.
- Use locale-aware APIs for plurals, dates, numbers, percentages, and currencies. Do not automatically translate proper names or user-generated content.
- Preserve the existing browser-language negotiation and prefix-free URLs unless a task explicitly changes that product decision.

## UI components

- Prefer an existing shadcn component over a raw HTML element when it fits the use case.
- Preserve shadcn registry component behavior unless a functional change is explicitly requested; performance-only changes are allowed.
