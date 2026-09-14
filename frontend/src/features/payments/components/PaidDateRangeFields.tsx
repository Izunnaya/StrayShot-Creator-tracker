import { joinClassNames } from '@/lib/classNames'

/**
 * The ledger's From and To dates, both inclusive and both optional.
 *
 * Inline after the campaign chips from md up, behind a hairline divider; below
 * md they take a row of their own, side by side, with the labels above the
 * fields and the fields tall enough to tap.
 *
 * Each picker is bounded by the other date so the calendar cannot offer a
 * backwards range. A typed date can still produce one, which the screen
 * explains in place of the rows rather than quietly swapping the ends.
 */
export function PaidDateRangeFields({
  paidFrom,
  paidTo,
  onChangePaidFrom,
  onChangePaidTo,
}: {
  paidFrom: string
  paidTo: string
  onChangePaidFrom: (date: string) => void
  onChangePaidTo: (date: string) => void
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 md:flex md:w-auto md:items-center md:gap-2">
      <div aria-hidden="true" className="mx-2.5 hidden h-5.5 w-px bg-hair md:block" />

      <DateField
        label="From"
        value={paidFrom}
        max={paidTo || undefined}
        onChange={onChangePaidFrom}
      />
      <DateField label="To" value={paidTo} min={paidFrom || undefined} onChange={onChangePaidTo} />
    </div>
  )
}

function DateField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: 'From' | 'To'
  value: string
  min?: string
  max?: string
  onChange: (date: string) => void
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.25 md:flex-row md:items-center md:gap-2">
      <span className="text-[10px] uppercase tracking-[1.5px] text-ink-muted md:text-[11px] md:tracking-[2px]">
        <span className="sr-only">Paid </span>
        {label}
      </span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className={joinClassNames(
          /* The native calendar icon is drawn dark by default and disappears
             against this background without the dark color scheme. */
          'min-h-11 w-full min-w-0 border border-hair bg-sunk px-3 py-2.75 text-[16px] text-ink [color-scheme:dark]',
          'md:min-h-0 md:w-auto md:px-2.5 md:py-1.5 md:text-[13px]',
        )}
      />
    </label>
  )
}
