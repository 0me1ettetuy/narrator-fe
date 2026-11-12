import type { ReactNode } from 'react';

// Content of the 404 and route-error pages: eyebrow, 56px title, serif
// description, optional mono detail line, action buttons, optional extra block.
function ErrorPageContent({
  eyebrow,
  title,
  description,
  detail,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  detail?: string;
  actions: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex w-full max-w-140 flex-col gap-6">
      <div className="flex flex-col gap-3.5">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <h1 className="font-heading text-4xl leading-none font-medium tracking-[-0.03em] sm:text-[56px]">
          {title}
        </h1>
        <p className="font-serif text-[17px] leading-normal text-muted-foreground">
          {description}
        </p>
        {detail && (
          <span className="font-mono text-xs break-all text-muted-foreground">
            {detail}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
      {children}
    </div>
  );
}

export { ErrorPageContent };
