import { useCurrentUser } from '@/shared/auth';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Separator } from '@/shared/ui/separator';
import { Link } from '@tanstack/react-router';

export function PublicHeader() {
  const { data, isAuthenticated } = useCurrentUser();
  const email = data?.user.email;

  return (
    <header className="border-b">
      <nav
        className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4"
        aria-label="Primary navigation"
      >
        <Link to="/hero" className="mr-auto font-semibold">
          Narrator
        </Link>
        <Link to="/about" className="text-sm text-muted-foreground">
          About
        </Link>
        {isAuthenticated ? (
          <>
            <Separator orientation="vertical" className="my-3" />
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Avatar className="size-7">
                <AvatarFallback>
                  {email?.slice(0, 1).toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-48 truncate font-medium">
                {email ?? 'Account'}
              </span>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-muted-foreground">
              Sign in
            </Link>
            <Link to="/register" className="text-sm font-medium">
              Create account
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
