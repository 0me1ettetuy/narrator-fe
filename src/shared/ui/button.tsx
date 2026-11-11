import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent whitespace-nowrap text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors select-none disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
        outline:
          'border-border bg-transparent text-foreground hover:bg-muted aria-expanded:bg-muted',
        secondary:
          'border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'text-foreground hover:bg-muted aria-expanded:bg-muted',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-foreground text-sm font-medium tracking-normal normal-case underline underline-offset-[3px] hover:text-destructive-text',
      },
      size: {
        default:
          'h-10 gap-2 px-3.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-7 gap-1 px-2 text-[10px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 px-2.5 text-[10px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-12 gap-2 px-5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-10',
        'icon-xs': 'size-7 [&_svg:not([class*=size-])]:size-3.5',
        'icon-sm': 'size-8 [&_svg:not([class*=size-])]:size-3.5',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
