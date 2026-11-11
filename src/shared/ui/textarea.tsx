import * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-20 w-full border border-input bg-card px-3.5 py-3 text-[15px] leading-normal transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
