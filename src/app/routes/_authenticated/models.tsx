import { createFileRoute } from '@tanstack/react-router';
import { ModelsPage } from '@/pages/models';

export const Route = createFileRoute('/_authenticated/models')({
  staticData: { breadcrumb: 'navigation.models' },
  component: ModelsPage,
});
