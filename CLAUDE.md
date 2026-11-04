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

For the production-style frontend container and its backend dependency, see
[container deployment](docs/architecture/container-deployment.md).

## Structure and boundaries

- Follow Feature-Sliced Design: `app → pages → widgets → features → entities →
shared`. The current product deliberately keeps most domain logic in its
  owning `pages/` slice; do not introduce empty features or entities.
  `features/delete-book` is the first feature slice: the same delete action is
  used by both the library card and the book page.
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
  declared EPUB language, and the recorded voice label. The chapter-curation
  workspace (`ChapterCurationPanel`) is implemented but its **Review
  chapters** entry point is currently commented out in `BookPage.tsx`; see
  `docs/issues/chapter-curation-hidden.md`. Each chapter card's role tag badge
  and the **Select narrated chapters** toolbar control are also commented out
  (only **Select all** remains); see
  `docs/issues/chapter-tags-and-narrated-selector-hidden.md`. It clears
  cached signed audio access after delete/requeue so the player does not
  retain a removed object URL. Each chapter's recorded voice label
  (`chapter.audio.voiceName`) is resolved server-side against the current
  voice catalogue, not joined client-side. A `TtsSelector` dropdown next to
  the batch Generate button shows the currently selected model as a
  non-interactive label and lets the user pick a Fish voice without leaving
  the page; it writes through the same voice-selection mutation/query as the
  Models page, so the two stay in sync. Switching the _model_ itself only
  happens on the Models page — the dropdown links there instead when no
  model is selected yet. Generate (both batch and the per-chapter retry
  action) is disabled, with an inline explanation, until a model is selected
  and, if that model is Fish, a voice is selected too — the backend has no
  fallback for either and rejects an incomplete selection; an archived Fish
  voice (its `.env` default removed) has its selection cleared server-side so
  this state can't go stale. Deleting a book (library card or book page) asks
  for confirmation, works in any parse/audio state, leaves the book page
  first, then drops every query for that book and refreshes the library
  list. The Models page owns Fish-key setup plus TTS-model and Fish
  default/custom voice selection. Default voices are deployment supplied and
  not removable; custom voices belong to the signed-in user. Fish voice
  controls are inactive unless a Fish model is selected, and archived/
  unavailable voices are hidden from both the voice picker and the voice
  list (unless currently selected, so the user can see what needs
  replacing). Local models are disabled: the `TtsSelector` dropdown shows
  nothing for them (there is currently nothing to switch to), and the Models
  page shows a static "Local models — Coming soon" section instead of the
  previous per-model rendering, which is commented out in place (not
  deleted). See `docs/issues/local-tts-models-disabled.md`, including its
  local-voice-selection TODO for how local models should pick a voice once
  restored.
- A book's owner (`book.book.isOwner`) can make it public (confirmed
  `AlertDialog`, same pattern as delete) or private again from the book page;
  a `Public` badge shows next to `Ready`/`EPUB` whenever it's public. Every
  owner-only control — selection, the batch toolbar, cover editing, delete
  book, per-chapter delete-audio and queue/retry — is hidden entirely for a
  non-owner viewing a public book; they keep the chapter list, ready audio's
  player, and the download button, plus **Add to library** (a saved
  reference, not a copy — the **My library** tab's **My books / Public /
  All** pills filter by it, reusing `book.publicBadge` as the pill label and
  the added book's card badge, not a library-specific "Saved"/"Added" label)
  and **Make a copy** (an independent, fully owned book). `/library`'s
  **Community** tab lists every public book, searchable by title.
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
