import type { ReactNode } from 'react';

// Title page header: 56px title, a muted meta line on its baseline, an intro
// sentence under it and optional actions on the right (Library, Home, Models).
function PageHeader({
  title,
  meta,
  description,
  actions,
}: {
  title: string;
  meta?: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-[620px] flex-col gap-3.5">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-heading text-4xl leading-none font-medium tracking-[-0.03em] sm:text-[56px]">
            {title}
          </h1>
          {meta && (
            <span className="text-sm text-muted-foreground">{meta}</span>
          )}
        </div>
        <p className="font-serif text-[17px] leading-normal text-muted-foreground">
          {description}
        </p>
      </div>
      {actions}
    </header>
  );
}

export { PageHeader };
