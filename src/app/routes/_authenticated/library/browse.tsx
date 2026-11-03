import { createFileRoute } from '@tanstack/react-router';
import { PublicLibraryPage } from '@/pages/library';

export const Route = createFileRoute('/_authenticated/library/browse')({
  staticData: { breadcrumb: 'library.browseTitle' },
  component: PublicLibraryPage,
});
