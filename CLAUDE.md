# Narrator frontend

## What this app is

Narrator's frontend is a React, TypeScript, and Vite single-page application.
It consumes the Nest backend through generated OpenAPI/TanStack Query helpers
and presents the public site, authenticated library, chapter audio workflow,
model selection, and chapter curation workspace.

## Main commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format:check
pnpm api:generate
```

`pnpm api:generate` requires the backend's `/openapi-json` endpoint to be
reachable. Do not leave a Vite dev server running after a task unless the user
explicitly asks for it.

## Structure and boundaries

- Follow Feature-Sliced Design: `app → pages → widgets → features → entities →
shared`. The current product deliberately keeps most domain logic in its
  owning `pages/` slice; do not introduce empty features or entities.
- Route configuration belongs in `src/app/routes`; pages compose the route UI;
  shared UI, transport, auth/session, i18n, and theme infrastructure belong in
  their existing `src/shared/` segments.
- Import other FSD slices through their public `index.ts` API. Use `@/` for
  `src/` imports.
- Never hand-edit `src/app/routeTree.gen.ts` or
  `src/shared/api/generated/`. They are generated and ignored.

## API, auth, and server state

- `src/shared/api/client.ts` is the single API transport configuration. It owns
  the backend base URL, credentials, bearer token, CSRF header, one-flight
  refresh, and retry after an authenticated `401`. Do not make component-level
  fetch wrappers.
- Access and CSRF tokens are in the in-memory `shared/auth/session` store;
  the refresh token remains in the backend's HttpOnly cookie. Preserve the
  bootstrap/refresh/CSRF lifecycle when changing auth.
- Use generated Hey API/TanStack Query query options and mutations through
  `@/shared/api`. Invalidate or update the relevant query after a mutation.
- Use `DataState` and purpose-built skeletons for normal server-state branches.
  Display localized error codes via `getApiErrorTranslationKey`, never raw
  provider or backend error messages.

## Product behavior to preserve

- Private routes are guarded once by `_authenticated`; public login/register
  routes redirect signed-in users away.
- The book page owns chapter selection, batch audio controls, audio playback,
  the recorded voice label, and the chapter-curation workspace. The Models
  page owns Fish-key setup plus TTS-model and Fish default/custom voice
  selection. Default voices are deployment supplied and not removable; custom
  voices belong to the signed-in user.
- The book detail query currently polls only while parsing or audio work is
  active. This is an intentional interim choice tracked in
  `docs/issues/book-audio-progress-polling.md`.
- Every visible string, including validation, toasts, aria labels, loading, and
  error text, needs English and Russian i18next values. Theme and locale are
  persistent client preferences.

## Guardrails

- Use existing shadcn primitives from `src/shared/ui` before adding a new one.
- Prefer semantic controls; icon-only buttons need accessible labels and
  normally tooltips. Keep layouts responsive and focus-visible.
- Use TanStack Form and Zod for forms; disable duplicate pending submissions.
- Do not commit generated API output, secrets, or a manually edited route tree.

## Further reading

- `AGENTS.md` — required frontend conventions and quality gate.
- `docs/README.md` — frontend documentation index and domain map.
- `docs/features/README.md` — pointer to the shared feature catalogue and its
  current product boundaries.
- `docs/history.md` — chronological frontend milestones and full committed
  change index.
- `docs/architecture/frontend-architecture.md` — detailed FSD, routing, API,
  state, localization, and accessibility guidance.
- `docs/architecture/frontend-delivery-checklist.md` — delivery checklist.
- `docs/books/chapter-curation-plan.md` — curation interaction and cache plan.
