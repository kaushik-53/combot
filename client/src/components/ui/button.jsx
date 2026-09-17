/**
 * Button — coss.com/ui vendored component
 * Built on a plain <button>/<a> element with Tailwind utility classes.
 * Variants: default | outline | ghost | destructive | link
 * Sizes: sm | md (default) | lg | icon
 */
import * as React from 'react';

const variantClasses = {
  default:
    'bg-primary text-primary-foreground shadow hover:bg-primary/90 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  outline:
    'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ghost:
    'hover:bg-accent hover:text-accent-foreground ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  destructive:
    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  link:
    'text-primary underline-offset-4 hover:underline ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
};

const sizeClasses = {
  sm:   'h-8 rounded-md px-3 text-xs',
  md:   'h-9 px-4 py-2 text-sm rounded-md',
  lg:   'h-10 rounded-md px-8 text-sm',
  icon: 'h-9 w-9 rounded-md',
};

const Button = React.forwardRef(function Button(
  {
    className = '',
    variant = 'default',
    size = 'md',
    asChild = false,
    disabled,
    children,
    ...props
  },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ' +
    'transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

  const classes = [
    base,
    variantClasses[variant] ?? variantClasses.default,
    sizeClasses[size]       ?? sizeClasses.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // asChild pattern: render the first child element with button props merged in
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref,
      className: [children.props.className, classes].filter(Boolean).join(' '),
      ...props,
    });
  }

  return (
    <button ref={ref} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
