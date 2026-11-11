# Narrator frontend instructions

This file governs work in `narrator-fe`. Read it before changing frontend
code. For examples and the delivery checklist, start at
[Frontend documentation](docs/README.md), then read:

- [Frontend architecture](docs/architecture/frontend-architecture.md)
- [Frontend delivery checklist](docs/architecture/frontend-delivery-checklist.md)
- [Container deployment](docs/architecture/container-deployment.md) when
  changing Docker, Compose, frontend delivery, or API-generation deployment
  behavior.
- [Feature catalogue](docs/features/README.md) when confirming existing
  frontend/product behavior or a feature boundary.
- [Change history](docs/history.md) when tracing when and how an existing
  capability entered the frontend.
- [Product behavior to preserve](docs/features/product-behavior.md) when
  changing the book page, Models page, library, sharing or collections.

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

## Guardrails

- **Reuse before you build.** Before writing any UI, search for what exists:
  `src/shared/ui` primitives, [UI primitives](docs/architecture/ui-primitives.md)
  for sizes, and the components in the slice and its siblings (`grep` for the
  markup you are about to write). Use an existing component as is. If it almost
  fits, extend it with a prop or slot rather than copying it.
- **Same markup twice, in two slices, means share it.** Pages cannot import
  each other, so move the shared piece down: `entities/<name>` for a domain
  object's UI (e.g. `entities/book`'s `BookCoverTile`), `features/` for a user
  action, `shared/ui` for a generic primitive. Do not paste a copy into the
  second page.
- **Balance KISS, DRY and SOLID.** Extract at the second real use, not the
  first guess; one component, one reason to change; no wrapper, option or layer
  for a use that does not exist yet. A short duplicate beats a premature
  abstraction, but a copied block of markup does not count as short.
- **Never invent sizes.** Use a primitive's own `size`/`variant` and the spacing
  and type steps in `ui-primitives.md`; no ad-hoc `h-*`, `px-*`, `text-[..px]` on
  a primitive to get a one-off look.
- Use existing shadcn primitives from `src/shared/ui` before adding a new one.
- Prefer semantic controls; icon-only buttons need accessible labels and
  normally tooltips. Keep layouts responsive and focus-visible.
- Use TanStack Form and Zod for forms; disable duplicate pending submissions.
- Do not commit generated API output, secrets, or a manually edited route tree.

## Core principles

- Use the **Feature-Sliced Design** skill for every frontend task that adds,
  moves, shares, or reviews frontend code. Follow its import direction:
  `app → pages → widgets → features → entities → shared`.
- Start in `pages/`. Add a feature, entity, or widget only when there is real,
  stable reuse. Do not create empty layers, speculative abstractions, or a
  `user` entity just for authentication.
- Respect public APIs: import another slice through its `index.ts`, not an
  internal path. `shared` exposes a public API per segment, not one global
  barrel.
- Apply SOLID, KISS, and DRY with judgment: a component/function should have
  one focused reason to change; duplicate only when extraction would make the
  code less clear; prefer direct, small code over generic frameworks.
- Preserve the user’s existing work. Do not hand-edit generated files,
  `src/app/routeTree.gen.ts`, or `src/shared/api/generated/`.

## Stack and structure

- React + TypeScript + Vite; use the `@/` alias for `src/` imports.
- Routing is **TanStack Router file-based routing**. Route files live in
  `src/app/routes`; the Vite plugin regenerates the route tree.
- Server state uses **TanStack Query**. Client-only UI state remains local
  unless it is truly app-wide.
- Backend contracts are generated by **Hey API OpenAPI TS** into
  `src/shared/api/generated/`. Run `pnpm api:generate` after an intentional
  backend OpenAPI change; never patch generated output.
- Forms use **TanStack Form + Zod**. Keep each form’s schema, defaults, submit
  mapping, and UI close to the page/feature that owns it.
- Use the existing **shadcn** components in `src/shared/ui` before building a
  new primitive. Keep custom styling small, semantic, responsive, accessible,
  and consistent with the existing tokens.

## Routing requirements

- Give every route an appropriate layout and keep route files focused on route
  configuration/composition.
- Use a route `loader` for navigation-critical prefetching or validation. When
  it loads server state, use TanStack Query cache APIs so the loader and view
  share one source of truth.
- Add a `pendingComponent` for meaningful route-level loading, an
  `errorComponent` for route failures, and `notFoundComponent` where a nested
  route needs a domain-specific 404. Preserve the root defaults in
  `src/app/router.tsx` and `src/app/routes/__root.tsx`.
- Use links/navigation APIs, not hard browser navigations. Keep authenticated
  access checks in the authenticated route layout, not duplicated in pages.

## Data fetching and API requirements

- Configure transport concerns once in `src/shared/api/client.ts`: base URL,
  credentials, auth, CSRF, and token refresh. Do not create per-component
  fetch wrappers.
- Consume generated TanStack Query options/mutations through the public
  `@/shared/api` API. Keep cache invalidation/update next to the mutation that
  owns it.
- Use `DataState` from `@/shared/ui/data-state` for ordinary remote
  data-loading/error/empty/success branches. Supply a purpose-built loading
  fallback when the page needs one.
- Loading layouts should use shadcn `Skeleton` components that resemble the
  eventual content; use `Spinner` only for compact, indeterminate actions.
- Never display raw server error text. Normalize backend errors with
  `@/shared/api/api-error.ts`, then translate its stable error code. New
  backend errors must use `{ code, statusCode, message }`; the UI localizes
  `code`, not `message`.

## Forms and mutations

- Use semantic `<form>` elements, TanStack Form field state, and a Zod schema.
  Do not hand-roll parallel input/error state when the form library owns it.
- Disable duplicate submits while a mutation is pending. Surface field errors
  near their fields and mutation failures through localized, accessible UI.
- Validate on the client for UX and rely on backend validation for authority.
  Map request DTOs explicitly when form shape differs from the API contract.

## Localization

- All user-visible strings—including empty, loading, error, validation,
  notification, aria-label, and button text—must use i18next.
- Add English keys in `src/shared/i18n/en.ts` and matching Russian values in
  `src/shared/i18n/ru.ts`; `en.ts` is the translation type source.
- Use interpolation/plurals rather than assembling translated fragments.
  Never expose provider, HTTP, or backend error messages directly.

## Accessibility and UI quality

- Prefer native HTML semantics. Every input needs an associated label; icon-
  only controls need an accessible label and normally a tooltip.
- Keep keyboard behavior, focus visibility, contrast, and responsive layouts
  intact. Do not use clickable `div`s when a button or link is correct.
- Reuse `DataState`, `EmptyState`, `ErrorState`, `LoadingState`, `Skeleton`,
  and existing shadcn components instead of recreating visually inconsistent
  states in each page.

## Quality gate

For relevant frontend changes, run:

```bash
pnpm build
pnpm lint
pnpm format:check
```

Run `pnpm api:generate` only when the backend OpenAPI schema has changed and
the backend is reachable. Check the resulting public API changes, but do not
commit generated API output because it is ignored by this repository.

## Definition of done

A task is done only when all of these hold:

1. The code works: `pnpm build`, `pnpm lint` and `pnpm format:check` pass.
2. Docs are synced: each affected doc is updated using the routing table in
   [`docs/README.md`](docs/README.md), and every new doc is linked from its
   folder README.
3. `docs/history.md` has an entry (short unique title, no hash) under "Recent
   changes", written before the commit.
4. Every doc you touched is within the size budget in `docs/README.md`; if one
   is over, split it before finishing.
5. No dev server, preview or watcher you started is left running.

## Documentation rules

Docs are a tree: this file links `docs/README.md`, whose routing table says
what every doc holds and when to edit it. Before adding or editing a doc, read
the rules at the top of `docs/README.md` (where facts go, how to create a
note, size budget, status tags).
