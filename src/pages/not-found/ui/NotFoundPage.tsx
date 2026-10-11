import { useRouter } from '@tanstack/react-router';
import { Button } from '@/shared/ui/button';

export function NotFoundPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <section className="max-w-sm text-center">
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you requested does not exist or has moved.
        </p>
        <Button className="mt-6" onClick={() => router.history.back()}>
          Go back
        </Button>
      </section>
    </main>
  );
}
