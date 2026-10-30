# Frontend change history

This is the committed history of `narrator-fe`, organized into milestones and
backed by a complete chronological commit index. It records what files and
capabilities actually changed in Git, rather than relying only on commit
subjects.

**Scope:** 26 August–28 October 2026, through commit `da87687`.

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

## Complete commit index

| Date | Commit | Recorded change |
| --- | --- | --- |
| 2026-08-26 | `f16cfad` | Created the React/Vite application baseline. |
| 2026-08-26 | `e46d329` | Added the TypeScript/Vite `@` import alias. |
| 2026-08-26 | `2a6e987` | Added Prettier and related project configuration. |
| 2026-08-26 | `b2c45b2` | Added VS Code settings. |
| 2026-08-26 | `243ba38` | Added editor extension recommendations. |
| 2026-08-26 | `fd2bf63` | Added shadcn UI primitives and utilities. |
| 2026-08-26 | `13eafed` | Adjusted editor handling for Tailwind v4 rules. |
| 2026-08-26 | `9485e03` | Removed Vite template UI/assets. |
| 2026-08-26 | `950624c` | Added TanStack Query and its ESLint plugin. |
| 2026-08-26 | `3467471` | Added QueryClient and root Query provider. |
| 2026-08-26 | `a111cf2` | Added TanStack Router dependency. |
| 2026-08-26 | `a9df164` | Added file-based router/root, home, and about routes. |
| 2026-08-26 | `2631008` | Excluded generated route output from lint/format checks. |
| 2026-09-29 | `6a328a8` | Migrated the application to FSD-oriented structure. |
| 2026-10-06 | `92bcd21` | Added OpenAPI generation and non-UI auth/session client support. |
| 2026-10-12 | `64a8c22` | Added auth/public routes, app shell, navigation, theme, and base pages. |
| 2026-10-12 | `318fcfd` | Added English/Russian localization and locale controls. |
| 2026-10-13 | `5aee98a` | Added toasts and localized API-error mapping. |
| 2026-10-13 | `d378f3a` | Added shared loading, error, and empty data states. |
| 2026-10-13 | `43db021` | Added a route-level error page. |
| 2026-10-13 | `fc12396` | Added TanStack Form and Zod auth-form validation. |
| 2026-10-13 | `cbbf7e8` | Added frontend agent guidance and architecture docs. |
| 2026-10-19 | `66a828e` | Added protected library, book route, and direct EPUB upload UI. |
| 2026-10-19 | `3d2432b` | Added chapter audio-generation controls. |
| 2026-10-20 | `e1aece0` | Refined the chapter conversion UI. |
| 2026-10-25 | `5e96fa2` | Added the model-selection and Fish credential page. |
| 2026-10-26 | `7ff3f12` | Added multi-chapter selection and cover-image UI. |
| 2026-10-28 | `48b969f` | Added chapter-curation UI and interaction model. |
| 2026-10-28 | `da87687` | Reorganized frontend documentation by domain. |

