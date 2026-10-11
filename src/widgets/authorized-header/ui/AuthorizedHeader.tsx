import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';

export function AuthorizedHeader() {
  return (
    <header className="flex h-14 items-center border-b px-4">
      <HeaderBreadcrumbs />
    </header>
  );
}
