# Frontend architecture

## Purpose

Narrator is a Vite React application using Feature-Sliced Design (FSD),
TanStack Router, TanStack Query, and an OpenAPI-generated client. The goal is
to keep domain ownership obvious, server state reliable, and route behavior
predictable without premature abstraction.

## FSD placement

```text
app/       application setup: providers, routing, styles, entry point
pages/     route-level screens and page-specific UI/logic
widgets/   composite UI reused by multiple pages, e.g. application headers
features/  reusable user actions used in more than one place
entities/  stable, reusable business-domain models only when justified
shared/    infrastructure: UI kit, API client, auth, i18n, theme, utilities
```

Dependencies point downward only:

```text
app → pages → widgets → features → entities → shared
```

Use public `index.ts` APIs for slices. Do not add a layer simply because it
could be useful later. A page-local form or query belongs in its page until
there is demonstrated reuse.

### Existing shared ownership

- `shared/api`: generated OpenAPI client, transport configuration, error-code
  normalization.
- `shared/auth`: session/access-token/CSRF lifecycle and current-user state.
- `shared/i18n`: i18next setup and locale resources.
- `shared/theme`: global color-mode infrastructure.
- `shared/ui`: shadcn primitives and shared presentational states.

## Routing

Routes live in `src/app/routes`; TanStack Router generates
`src/app/routeTree.gen.ts`. Never edit the generated tree.

Use pathless layouts for shared public/authenticated composition. Route
components should not recreate parent navigation, session bootstrapping, or
global providers.

For a new route, choose the behavior deliberately:

- `loader`: prefetch/navigation validation that must finish before meaningful
  route rendering. Query-backed loaders should use the QueryClient cache.
- `pendingComponent`: route-level loading while the loader or lazy chunk is
  pending.
- `errorComponent`: a recovery-oriented view for failures local to the route.
- `notFoundComponent`: a route-specific missing-resource UI when the global
  404 is not sufficient.

The root route owns the global not-found fallback and the router owns the
global route-error fallback.

## API and server state

The Nest backend owns the contract. Swagger/OpenAPI generates the typed client
and TanStack Query options under `shared/api/generated`.

```text
Backend OpenAPI schema
  → pnpm api:generate
  → shared/api/generated/ (ignored; never manually edited)
  → shared/api public exports
  → page/feature/widget query or mutation
```

`shared/api/client.ts` is the one transport boundary for base URL,
credentials, CSRF, bearer access tokens, and refresh/retry behavior. Do not
bypass it with ad-hoc `fetch` calls except for a deliberately documented
transport primitive.

Server state belongs in TanStack Query, not `useEffect` plus `useState`.
Keep query options/keys and mutation cache updates near the consuming domain.
Use invalidation for simple correctness and `setQueryData` only when the cache
update is small and unambiguous.

## Remote UI states

For a normal query view, use `DataState` from `shared/ui/data-state`:

```tsx
<DataState
  query={booksQuery}
  isEmpty={(books) => books.length === 0}
  loading={<BooksSkeleton />}
  empty={<EmptyState />}
>
  {(books) => <BookList books={books} />}
</DataState>
```

- Prefer a shadcn `Skeleton` layout that matches the final screen.
- Use `EmptyState` for a meaningful no-data state and an action when useful.
- Use `ErrorState` or a custom localized recovery view with retry.
- `DataState` is for query state inside a screen; router pending/error/not-found
  components are for navigation and route boundaries.

## Forms

Use TanStack Form and Zod together:

1. Define a typed Zod schema for the form’s domain near its owner.
2. Initialize TanStack Form from explicit defaults.
3. Render field-level validation accessibly.
4. Convert the valid form value to the generated API DTO at submit time.
5. Use a TanStack Query mutation, prevent duplicate submit, and handle its
   localized error/success state.

Do not derive form errors from backend English messages. Client validation is
for fast feedback; backend validation remains authoritative.

## Localization and errors

The supported locales are English and Russian. `en.ts` defines the translation
shape; `ru.ts` must satisfy it.

All UI text is translated. This includes labels, placeholders, dialog copy,
toasts, aria labels, empty/loading/error states, validation, and route
boundaries.

Backend messages are not presentation copy. The backend returns a stable error
`code`; `shared/api/api-error.ts` maps it to a translation key. Add a new
backend error in this order:

1. Backend: return `{ code, statusCode, message }`.
2. Frontend: add the code/key mapping in `api-error.ts`.
3. Frontend: add English and Russian translation values.
4. Render the translated value, never `error.message`.

## UI and accessibility

Use installed shadcn components from `shared/ui` first. New shared primitives
belong there only if several domains need them; page-specific composition stays
local.

Use native elements where possible, labels for fields, clear focus states,
keyboard-capable interactions, accessible names for icon-only controls, and
responsive layouts. Treat visual states as part of the feature, not polishing
to defer.
