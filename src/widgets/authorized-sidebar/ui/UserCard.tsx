import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';

type UserCardProps = {
  email: string | undefined;
  isLoggingOut: boolean;
  onLogout: () => void;
};

function getInitial(email: string | undefined) {
  return email?.slice(0, 1).toUpperCase() ?? '?';
}

export function UserCard({ email, isLoggingOut, onLogout }: UserCardProps) {
  const { t } = useTranslation();

  return (
    // The row keeps its expanded width and the wrapper clips it, so the text is
    // already in place when the sidebar opens (like the nav links).
    <div className="overflow-hidden">
      <div className="flex w-[calc(var(--sidebar-width)-1rem-1px)] items-center gap-2 px-1 py-1">
        <Avatar className="size-8">
          <AvatarFallback>{getInitial(email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 transition-[visibility] duration-200 group-data-[collapsible=icon]:invisible">
          <p className="truncate text-sm font-medium">
            {email ?? t('common.account')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('common.signedIn')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('sidebar.logOut')}
          title={t('sidebar.logOut')}
          disabled={isLoggingOut}
          onClick={onLogout}
          className="transition-[visibility] duration-200 group-data-[collapsible=icon]:invisible"
        >
          <LogOut />
        </Button>
      </div>
    </div>
  );
}
