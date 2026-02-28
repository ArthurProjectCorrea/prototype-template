import * as React from 'react';
import { cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

import { Spinner } from '@/components/ui/spinner';

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  children,
  ...props
}) {
  // When `asChild` is true we render a Radix `Slot.Root` which internally
  // uses `React.Children.only` to enforce exactly one child.  If the caller
  // passes whitespace around the single element (as is common when writing
  // JSX on multiple lines) it will be interpreted as additional text nodes and
  // trigger the runtime error reported in the bug.  We filter out any
  // "empty" text nodes here so that the slot always receives a single element.
  //
  // Additionally, rendering a spinner as a sibling of the child would also
  // violate the single-child requirement, so we intentionally disable the
  // built‑in loading indicator when `asChild` is used.  Consumers who need a
  // spinner can add one inside the wrapped element instead.
  const Comp = asChild ? Slot.Root : 'button';

  let content = children;
  if (asChild) {
    // strip out any whitespace-only text nodes that might have been created by
    // JSX formatting (indentation/newlines).  `Slot.Root` will call
    // `React.Children.only` on the result, which throws if it receives more than
    // one child.
    const arr = React.Children.toArray(children).filter(
      (c) => !(typeof c === 'string' && /^\s*$/.test(c))
    );
    content = arr.length === 1 ? arr[0] : arr;

    // if the button is in a loading state we still want to show the spinner,
    // but it needs to be rendered *inside* the single child element so that the
    // slot requirement is satisfied.  We clone the element and prepend the
    // spinner to its children.
    if (loading && React.isValidElement(content)) {
      const existingChildren = content.props.children;
      content = React.cloneElement(
        content,
        undefined,
        <>
          <Spinner className="mr-2" />
          {existingChildren}
        </>
      );
    }
  }

  return (
    <Comp
      disabled={loading || props.disabled}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { Button, buttonVariants };
