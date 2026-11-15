# Aged book-cover variants

Status: deferred. Let a book owner choose an optional worn, scratched cover
variant for a more tactile library appearance.

- Keep the normal cover as the default and let the owner choose it again after
  generation; never present a generated variant as a replacement for the
  original.
- Show an explicit generating, ready, and failure state. The library continues
  to use the selected existing cover until the generated variant is ready.
- Render the active cover through the existing signed-cover access flow; do not
  expose a raw asset URL or storage identifier.
- Localize controls and state messages, and keep cover editing owner-only.

The backend job, storage, and safety requirements are in the
[backend issue](../../../narrator-general-api/docs/issues/aged-book-covers.md).
