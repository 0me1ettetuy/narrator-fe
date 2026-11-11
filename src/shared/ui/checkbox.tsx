'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';

import { cn } from '@/shared/lib/utils';
import { CheckIcon, MinusIcon } from 'lucide-react';

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer group/checkbox relative flex size-5 shrink-0 items-center justify-center border-[1.5px] border-muted-foreground bg-card transition-colors group-has-disabled/field:opacity-45 after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon className="group-data-[indeterminate]/checkbox:hidden" />
        <MinusIcon className="hidden group-data-[indeterminate]/checkbox:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
