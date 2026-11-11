import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from './button';
import { Input } from './input';

// An Input with a show/hide button; pass everything but `type` as for Input.
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, 'type'>) {
  const { t } = useTranslation();
  const [isShown, setIsShown] = useState(false);
  const label = isShown ? t('auth.hidePassword') : t('auth.showPassword');

  return (
    <div className="relative">
      <Input
        {...props}
        type={isShown ? 'text' : 'password'}
        className={cn('pr-12', className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1.5 right-1.5 text-muted-foreground"
        aria-label={label}
        title={label}
        aria-pressed={isShown}
        onClick={() => setIsShown((shown) => !shown)}
      >
        {isShown ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
    </div>
  );
}
