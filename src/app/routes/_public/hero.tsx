import { createFileRoute } from '@tanstack/react-router';
import { HeroPage } from '@/pages/hero';

export const Route = createFileRoute('/_public/hero')({
  component: HeroPage,
});
