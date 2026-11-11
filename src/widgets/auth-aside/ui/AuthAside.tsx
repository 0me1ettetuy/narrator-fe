import { useTranslation } from 'react-i18next';
import { LogoMark } from '@/shared/ui/logo';
import loginImage from '../assets/login.jpg';
import registerImage from '../assets/register.jpg';

const ASIDES = {
  login: { image: loginImage, quote: 'auth.quoteLogin' },
  register: { image: registerImage, quote: 'auth.quoteRegister' },
} as const;

// Picture panel beside the sign-in and register forms; hidden on small screens.
export function AuthAside({ variant }: { variant: keyof typeof ASIDES }) {
  const { t } = useTranslation();
  const { image, quote } = ASIDES[variant];

  return (
    <aside
      aria-hidden="true"
      className="relative hidden min-w-0 flex-1 overflow-hidden bg-foreground lg:block"
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="relative flex h-full flex-col items-start justify-between p-5">
        <span className="inline-flex h-8 items-center gap-2 bg-foreground px-2.5 text-[10px] font-semibold tracking-[0.06em] text-background uppercase">
          <LogoMark className="h-[15px] w-[18px] text-brand" />
          {t('auth.asideTag')}
        </span>
        <figure className="flex max-w-105 flex-col gap-2 bg-foreground p-4 text-background shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)]">
          <blockquote className="font-serif text-xl leading-[1.35]">
            {t(quote)}
          </blockquote>
          <figcaption className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            {t('auth.quoteSource')}
          </figcaption>
        </figure>
      </div>
    </aside>
  );
}
