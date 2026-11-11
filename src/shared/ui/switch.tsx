'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from '@/shared/lib/utils';

function Switch({
  className,
  size = 'default',
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch relative inline-flex shrink-0 items-center border border-border bg-secondary transition-colors after:absolute after:-inset-x-3 after:-inset-y-2 aria-invalid:border-destructive data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-5 data-[size=sm]:w-9 data-checked:border-primary data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block bg-muted-foreground transition-transform group-data-[size=default]/switch:size-[18px] group-data-[size=sm]/switch:size-3.5 group-data-[size=default]/switch:translate-x-0.5 group-data-[size=sm]/switch:translate-x-0.5 group-data-[size=default]/switch:data-checked:translate-x-[21px] group-data-[size=sm]/switch:data-checked:translate-x-[17px] data-checked:bg-primary-foreground"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
