# Frontend change history

This is the committed history of `narrator-fe`, organized into milestones and
backed by a complete chronological commit index. It records what files and
capabilities actually changed in Git, rather than relying only on commit
subjects.

**Scope:** 26 August–31 October 2026, through the current local library-author
metadata display change.

Uncommitted changes are intentionally excluded: they do not yet have a stable
date or commit identity. Add a short milestone and one index row when a future
change is committed.

## Milestones

### 26 August — Vite foundation, UI primitives, and routing/state libraries

- Created the React, TypeScript, and Vite application with the `@` alias,
  Prettier, ESLint, editor recommendations, and template cleanup.
- Added the shadcn component set and the common UI utility/mobile-hook
  infrastructure.
- Added TanStack Query with its root client/provider and TanStack Router with
  file-based root, home, and about routes. Generated route output was excluded
  from linting/formatting.

### 29 September — Feature-Sliced Design migration

- Replaced the starter application structure with FSD layers.
- Moved route composition under `app`, reusable primitives into `shared/ui`,
  base pages into `pages`, and app-wide styles/providers into `app`.

### 6–13 October — authenticated application shell and frontend foundations

- Added OpenAPI/Hey API configuration, centralized API transport, session
  bootstrap, in-memory access/CSRF session state, and auth helpers.
- Added public and authenticated route layouts; login, registration, hero,
  home, about, and not-found pages; public and authorized headers; collapsible
  authorized sidebar; breadcrumb support; and persisted theme preference.
- Added English/Russian i18next infrastructure, localized API error mapping,
  toasts, reusable loading/error/empty states, a route-error page, and
  TanStack Form + Zod validation for authentication.
- Added frontend agent guidance, architecture documentation, and delivery
  checks.

### 19–20 October — library, direct EPUB upload, and chapter audio controls

- Added protected Library and Book routes, upload-form flow, book-card list,
  loading skeletons, and book detail data composition.
- Added chapter audio-generation controls, status/progress display, stop and
  deletion actions, signed-audio playback/download, and the API client support
  needed by those interactions.

### 25–28 October — model selection, covers, and chapter curation

- Added the Models page, Fish credential form, model selection interface,
  localized API error behavior, and a documented interim book-progress polling
  approach.
- Added select-all/select-some chapter generation UX plus EPUB cover artwork
  on library cards and book detail.
- Added the chapter-curation editor/panel and model layer for title/text,
  tag, merge, delete, and narration-related chapter management, together with
  its interaction plan.
- Reorganized frontend documentation into architecture, books, features, and
  issues domains.

### 30 October — book workflow refinements and Fish voice management

- Refined the library, upload dialog, book page, model page, shared checkbox,
  and authenticated header behavior; this was a cross-page usability pass, not
  a new backend capability.
- Added the Fish voice-management UI: users can add labeled custom reference
  voices, select a default or owned custom voice, and remove custom voices.
  The book page exposes the voice recorded for generated chapter audio.

### 31 October — audio status, model rollout, and failure-state refinements

- Book detail now displays declared EPUB language and resolves generated Fish
  voice IDs to their saved human-friendly voice names.
- Deleting or re-queueing chapter audio clears the cached signed playback URL,
  preventing a stale browser/player URL from representing replacement audio.
- Fish voice controls are collapsed by default and inactive unless a Fish model
  is selected. Until each local adapter is verified end-to-end, only Piper is
  selectable and other local cards show **Coming soon**.
- Reworked the shared data error state into a clear retryable empty-state UI;
  documented the temporary local-model rollout guard.

### 31 October — book-cover viewing and replacement

- The book page now presents a slightly larger cover. Clicking an existing
  cover opens a viewport-constrained full-image dialog, while the close control
  belongs to the image-sized dialog rather than an unrelated wide container.
- A small tooltip-labelled edit control on the cover opens a replacement flow
  that mirrors the EPUB upload dialog: a dashed picker, selected-image card,
  thumbnail, removal control, and full-width save action.
- The replacement mutation refreshes the book detail, signed-cover URL, and
  library-card caches so the new private object appears without a reload.

### 31 October — library author metadata

- Library cards now prefer the ordered EPUB author names returned in the book
  list over the uploaded filename. Books without author metadata retain a
  localized unknown-author fallback.

## Complete commit index

| Date       | Commit    | Recorded change                                                                                              |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| 2026-08-26 | `f16cfad` | Created the React/Vite application baseline.                                                                 |
| 2026-08-26 | `e46d329` | Added the TypeScript/Vite `@` import alias.                                                                  |
| 2026-08-26 | `2a6e987` | Added Prettier and related project configuration.                                                            |
| 2026-08-26 | `b2c45b2` | Added VS Code settings.                                                                                      |
| 2026-08-26 | `243ba38` | Added editor extension recommendations.                                                                      |
| 2026-08-26 | `fd2bf63` | Added shadcn UI primitives and utilities.                                                                    |
| 2026-08-26 | `13eafed` | Adjusted editor handling for Tailwind v4 rules.                                                              |
| 2026-08-26 | `9485e03` | Removed Vite template UI/assets.                                                                             |
| 2026-08-26 | `950624c` | Added TanStack Query and its ESLint plugin.                                                                  |
| 2026-08-26 | `3467471` | Added QueryClient and root Query provider.                                                                   |
| 2026-08-26 | `a111cf2` | Added TanStack Router dependency.                                                                            |
| 2026-08-26 | `a9df164` | Added file-based router/root, home, and about routes.                                                        |
| 2026-08-26 | `2631008` | Excluded generated route output from lint/format checks.                                                     |
| 2026-09-29 | `6a328a8` | Migrated the application to FSD-oriented structure.                                                          |
| 2026-10-06 | `92bcd21` | Added OpenAPI generation and non-UI auth/session client support.                                             |
| 2026-10-12 | `64a8c22` | Added auth/public routes, app shell, navigation, theme, and base pages.                                      |
| 2026-10-12 | `318fcfd` | Added English/Russian localization and locale controls.                                                      |
| 2026-10-13 | `5aee98a` | Added toasts and localized API-error mapping.                                                                |
| 2026-10-13 | `d378f3a` | Added shared loading, error, and empty data states.                                                          |
| 2026-10-13 | `43db021` | Added a route-level error page.                                                                              |
| 2026-10-13 | `fc12396` | Added TanStack Form and Zod auth-form validation.                                                            |
| 2026-10-13 | `cbbf7e8` | Added frontend agent guidance and architecture docs.                                                         |
| 2026-10-19 | `66a828e` | Added protected library, book route, and direct EPUB upload UI.                                              |
| 2026-10-19 | `3d2432b` | Added chapter audio-generation controls.                                                                     |
| 2026-10-20 | `e1aece0` | Refined the chapter conversion UI.                                                                           |
| 2026-10-25 | `5e96fa2` | Added the model-selection and Fish credential page.                                                          |
| 2026-10-26 | `7ff3f12` | Added multi-chapter selection and cover-image UI.                                                            |
| 2026-10-28 | `48b969f` | Added chapter-curation UI and interaction model.                                                             |
| 2026-10-28 | `da87687` | Reorganized frontend documentation by domain.                                                                |
| 2026-10-30 | `3a15507` | Refined the library/upload/book/model screens, shared controls, localization, and frontend documentation.    |
| 2026-10-30 | `9a37991` | Added Fish voice management, default/custom voice selection, and displayed the recorded chapter-audio voice. |
| 2026-10-31 | `ae3399e` | Refined audio cache invalidation, voice/model controls, book language display, and data error states.        |
| 2026-10-31 | `0c0111a` | Added full-cover viewing and direct private-cover replacement UI.                                            |
| 2026-10-31 | `current` | Displayed ordered book authors on library cards with an unknown-author fallback.                             |
