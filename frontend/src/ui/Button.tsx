import type { ButtonHTMLAttributes } from 'react'
import { joinClassNames } from '../lib/classNames'

/**
 * Every button in the application, by role rather than by appearance — so a
 * caller asks for the "primary action" and does not have to know it is amber.
 */
export type ButtonVariant =
  /** Solid amber. The main action on a screen or in a dialog. */
  | 'primary'
  /** Amber outline that fills on hover. Row-level actions, such as Record payment. */
  | 'outline'
  /** Grey outline. Secondary actions sitting beside a primary one. */
  | 'secondary'
  /** Text only, no border. Low-emphasis actions such as Edit campaign. */
  | 'text'
  /** Dashed outline. Additive actions such as New campaign. */
  | 'addNew'

const sharedButtonClasses =
  'font-head uppercase whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-2'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-amber text-ground border-none font-semibold text-[12px] tracking-[1px] px-3.5 py-2 md:text-[13px] md:tracking-[1.5px] md:px-4.5 md:py-2.25 hover:bg-ink',
  outline:
    'bg-transparent border border-amber text-amber text-[11px] tracking-[1.5px] px-2.75 py-2 md:py-1.5 transition-colors duration-150 hover:bg-amber hover:text-ground',
  secondary:
    'bg-transparent border border-hair text-ink text-[13px] tracking-[1.5px] px-4.5 py-2.75 hover:border-amber hover:text-amber',
  text: 'bg-transparent border-none text-ink-muted text-[13px] tracking-[1px] px-1 py-2 md:py-1.5 hover:text-amber',
  addNew:
    'bg-transparent border border-dashed border-hair-6 text-ink-muted font-body font-semibold text-[13px] tracking-[0.5px] px-3.5 py-2 md:py-1.5 hover:text-amber hover:border-amber',
}

export function Button({
  variant = 'primary',
  children,
  className,
  ...buttonProps
}: { variant?: ButtonVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={joinClassNames(sharedButtonClasses, variantClasses[variant], className)}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
