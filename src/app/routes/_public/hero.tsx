import { createFileRoute } from '@tanstack/react-router';
import { HeroPageAdvanced } from '@/pages/hero';

// import { HeroPage } from '@/pages/hero';

export const Route = createFileRoute('/_public/hero')({
  // component: HeroPage,
  component: HeroPageAdvanced,
});
