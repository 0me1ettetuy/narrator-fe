import { cn } from '@/shared/lib/utils';

// A small label over a value, for a book's details row.
export function BookMetadata({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <dt className="text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="truncate text-[15px] font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}
