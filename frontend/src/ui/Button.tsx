import type { ButtonHTMLAttributes } from 'react'
import { joinClassNames } from '@/lib/classNames'

/**
 * Every button in the application, by role rather than by appearance — so a
 * caller asks for the "primary action" and does not have to know it is amber.
 */
export type ButtonVariant =
  /** Solid amber. The main action on a screen or in a dialog. */
  | 'primary'
  /** Amber outline that fills on hover. Row-level actions, such as Record payment. */
  | 'outline'
  /** Grey outline, white text. Secondary actions such as Edit or Back. */
  | 'secondary'
  /** Grey outline, grey text. Dismissing a dialog. */
  | 'cancel'
  /** Text only, no border. Low-emphasis actions such as Edit campaign. */
  | 'text'
  /** Dashed outline. Additive actions such as New campaign. */
  | 'addNew'

/**
 * How much room the button takes, following the design's three sizes:
 * "regular" in page chrome, "dialog" in a modal's actions row, where the
 * buttons are the last thing read and get more padding, and "compact" beside
 * a section heading. "block" fills its container at a thumb's height, as the
 * phone sheets lay their actions out, and "sheet" is block on a phone and
 * dialog from md up, for a modal's actions row.
 */
export type ButtonSize = 'regular' | 'dialog' | 'compact' | 'block' | 'sheet'

/* The font is part of each variant rather than shared: the design sets the
   text and add-new buttons in the body face and everything else in the
   condensed one, and two font-family utilities on one element resolve by
   stylesheet order rather than by which was written last. */
const sharedButtonClasses =
  'whitespace-nowrap cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-2'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'font-head font-semibold uppercase bg-amber text-ground border-none hover:bg-ink',
  outline:
    'font-head uppercase bg-transparent border border-amber text-amber transition-colors duration-150 hover:bg-amber hover:text-ground',
  secondary:
    'font-head uppercase bg-transparent border border-hair text-ink hover:border-amber hover:text-amber',
  cancel: 'font-head uppercase bg-transparent border border-hair text-ink-muted hover:text-ink',
  text: 'font-body uppercase bg-transparent border-none text-ink-muted text-[13px] tracking-[1px] p-0 hover:text-amber',
  addNew:
    'font-body font-semibold bg-transparent border border-dashed border-hair-6 text-ink-muted text-[14px] px-3.5 py-2.25 min-h-10 md:min-h-0 md:text-[13px] md:tracking-[0.5px] md:py-1.5 hover:text-amber hover:border-amber',
}

/** Text and add-new buttons carry their own sizing; the rest take one of these. */
const sizeClasses: Record<ButtonSize, string> = {
  regular: 'text-[13px] tracking-[1.5px] px-4.5 py-2.25',
  dialog: 'text-[13px] tracking-[1.5px] px-5 py-2.75',
  compact: 'text-[12px] tracking-[1.5px] px-4 py-2.25',
  block: 'w-full text-[13px] tracking-[1.5px] py-3.5 min-h-12',
  sheet:
    'w-full text-[13px] tracking-[1.5px] py-3.5 min-h-12 md:w-auto md:min-h-0 md:px-5 md:py-2.75',
}

const outlineSizeClasses: Record<ButtonSize, string> = {
  regular: 'text-[11px] tracking-[1.5px] px-2.75 py-1.5',
  dialog: 'text-[13px] tracking-[1.5px] px-4.5 py-2.75',
  compact: 'text-[11px] tracking-[1.5px] px-2.75 py-1.5',
  block: 'w-full text-[12px] tracking-[1.5px] py-3 min-h-11',
  sheet:
    'w-full text-[13px] tracking-[1.5px] py-3.5 min-h-12 md:w-auto md:min-h-0 md:px-4.5 md:py-2.75',
}

/* A secondary button is taller in page chrome (the creator screen's Edit) and
   a little narrower in a dialog (Back) than the defaults. */
const secondarySizeClasses: Record<ButtonSize, string> = {
  ...sizeClasses,
  regular: 'text-[13px] tracking-[1.5px] px-4.5 py-3',
  dialog: 'text-[13px] tracking-[1.5px] px-4.5 py-2.75',
  sheet:
    'w-full text-[13px] tracking-[1.5px] py-3.5 min-h-12 md:w-auto md:min-h-0 md:px-4.5 md:py-2.75',
}

/* The design pads a dialog's main action wider than the buttons beside it. */
const primarySizeClasses: Record<ButtonSize, string> = {
  ...sizeClasses,
  dialog: 'text-[13px] tracking-[1.5px] px-6 py-2.75',
  sheet:
    'w-full text-[13px] tracking-[1.5px] py-3.5 min-h-12 md:w-auto md:min-h-0 md:px-6 md:py-2.75',
}

export function Button({
  variant = 'primary',
  size = 'regular',
  children,
  className,
  ...buttonProps
}: { variant?: ButtonVariant; size?: ButtonSize } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizing =
    variant === 'text' || variant === 'addNew'
      ? undefined
      : variant === 'outline'
        ? outlineSizeClasses[size]
        : variant === 'primary'
          ? primarySizeClasses[size]
          : variant === 'secondary'
            ? secondarySizeClasses[size]
            : sizeClasses[size]

  return (
    <button
      type="button"
      className={joinClassNames(sharedButtonClasses, variantClasses[variant], sizing, className)}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
