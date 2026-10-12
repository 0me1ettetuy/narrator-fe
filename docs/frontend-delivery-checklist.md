# Frontend delivery checklist

Use this checklist for every meaningful frontend change.

## Before coding

- Read `AGENTS.md` and use the FSD skill if the task touches frontend
  structure, data ownership, shared UI, forms, routes, or API integration.
- Identify the owning FSD layer. Keep single-use logic in the page first.
- Inspect existing shared components/API helpers before adding a new one.
- Confirm whether the API contract already exposes the data/action. If it does
  not, change/document the backend contract before inventing a frontend shape.

## Route changes

- Add/adjust the file in `src/app/routes`; do not edit `routeTree.gen.ts`.
- Define layout, route parameters/search validation, loader, pending,
  error, and not-found behavior as needed.
- Use TanStack Router `Link`, `Navigate`, and navigation APIs.
- Keep authorization at the appropriate route boundary.

## Query and mutation changes

- Use the public `@/shared/api` exports and generated options/mutations.
- Use TanStack Query for server state; do not duplicate remote data in local
  state or load it in an ad-hoc effect.
- Render loading/error/empty/success through `DataState`; add a content-shaped
  shadcn skeleton when loading is visible.
- Invalidate or update the exact query keys after a successful mutation.
- Normalize errors with `getApiErrorCode` / translation-key helpers. Do not
  display server messages.

## Form changes

- Use TanStack Form and a Zod schema.
- Keep the schema, defaults, DTO mapper, and submit behavior with the form’s
  owning page/feature.
- Localize all visible validation and mutation feedback.
- Ensure submit has pending/disabled state and fields have labels and
  associated error messaging.

## UI and localization

- Reuse shadcn and existing shared UI before writing custom primitives.
- Keep components focused; extract only for clear reuse or readability.
- Add every new visible string to both `shared/i18n/en.ts` and
  `shared/i18n/ru.ts`.
- Check keyboard behavior, focus, mobile layout, truncation, empty states, and
  destructive-action confirmation where applicable.

## API generation and verification

- If the backend OpenAPI schema changed, run `pnpm api:generate` with the
  backend reachable. Inspect generated public types/options but do not edit or
  commit generated output.
- Run `pnpm build`, `pnpm lint`, and `pnpm format:check` for code changes.
- Do not leave a dev server, preview, watcher, or other long-running process
  running unless explicitly requested. If one is intentionally left running,
  report its command, port, and stop command.
