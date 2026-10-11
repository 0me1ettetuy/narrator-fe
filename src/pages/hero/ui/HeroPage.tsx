import { Link } from '@tanstack/react-router';
import { useCurrentUser } from '@/shared/auth';
import { Button } from '@/shared/ui/button';

export function HeroPage() {
  const { data, isAuthenticated } = useCurrentUser();

  return (
    <main className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-5xl items-center px-4 py-16">
      <section className="max-w-2xl space-y-6">
        <p className="text-sm font-medium text-muted-foreground">Narrator</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Turn ideas into clear stories.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {isAuthenticated
            ? `Signed in as ${data?.user.email ?? 'your account'}.`
            : 'Create an account to start using Narrator.'}
        </p>
        {isAuthenticated ? (
          <Button render={<Link to="/home" />}>Open workspace</Button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button render={<Link to="/register" />}>Create account</Button>
            <Button variant="outline" render={<Link to="/login" />}>
              Sign in
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
