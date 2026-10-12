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
    <div className="flex items-center gap-2 rounded-md px-2 py-1 group-data-[collapsible=icon]:-mx-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <Avatar className="size-8">
        <AvatarFallback>{getInitial(email)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-medium">
          {email ?? t('common.account')}
        </p>
        <p className="text-xs text-muted-foreground">{t('common.signedIn')}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('sidebar.logOut')}
        title={t('sidebar.logOut')}
        disabled={isLoggingOut}
        onClick={onLogout}
        className="group-data-[collapsible=icon]:hidden"
      >
        <LogOut />
      </Button>
    </div>
  );
}
