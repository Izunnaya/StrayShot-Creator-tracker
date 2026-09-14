import { joinClassNames } from '@/lib/classNames'
import { usePhoneLayout } from '@/lib/usePhoneLayout'
import { Button } from '@/ui'

/* The masthead. The tabs switch the screen below; which one is showing is
   the shell's state.

   From md up it is one 64px row exactly as the design was reviewed: wordmark,
   tabs, then the public page link and the primary action.

   On a phone the design moves the navigation to a tab bar along the bottom
   edge, where a thumb reaches it, and the masthead shrinks to a sticky 54px
   strip that says where you are: the wordmark and the screen's name, or a
   back button in place of the wordmark while a creator is open. */

/** The screens the tabs choose between. */
export type AppTab = 'overview' | 'payments'

const tabs: { id: AppTab; label: string; phoneLabel: string }[] = [
  { id: 'overview', label: 'Overview', phoneLabel: 'Roster' },
  { id: 'payments', label: 'Payments', phoneLabel: 'Payments' },
]

export function AppMasthead({
  activeTab = 'overview',
  onSelectTab,
  onAddCreator,
  phoneTitle,
  onBack,
}: {
  activeTab?: AppTab
  onSelectTab?: (tab: AppTab) => void
  onAddCreator?: () => void
  /** The screen's name in the phone masthead: Roster, Creator or Ledger. */
  phoneTitle?: string
  /** Present while a screen covers a tab, such as a creator's. Phone only. */
  onBack?: () => void
}) {
  const isPhone = usePhoneLayout()

  if (isPhone) {
    return (
      <>
        <header className="grain-masthead sticky top-0 z-30 flex h-13.5 items-center justify-between border-b border-amber px-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="-ml-0.5 min-h-11 cursor-pointer whitespace-nowrap border-none bg-transparent py-3 pr-3 text-[15px] uppercase tracking-[1px] text-amber focus-visible:outline-2 focus-visible:outline-amber"
            >
              ← Back
            </button>
          ) : (
            <div className="flex min-w-0 items-baseline gap-2.25">
              <div className="whitespace-nowrap font-display text-[20px] uppercase tracking-[1px] text-amber text-shadow-stencil">
                Stray Shot
              </div>
              <div className="whitespace-nowrap font-head text-[10px] uppercase tracking-[2px] text-ink-muted">
                Tracker
              </div>
            </div>
          )}
          {phoneTitle && (
            <div className="whitespace-nowrap font-head text-[12px] uppercase tracking-[2px] text-ink">
              {phoneTitle}
            </div>
          )}
        </header>

        <nav
          aria-label="Screens"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-hair bg-[#0e0d0a]"
        >
          {tabs.map((tab) => {
            const active = tab.id === activeTab && !onBack
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={onSelectTab ? () => onSelectTab(tab.id) : undefined}
                className={joinClassNames(
                  'cursor-pointer whitespace-nowrap border-0 border-t-2 bg-transparent pb-5.5 pt-4.5 font-head text-[12px] uppercase tracking-[1.5px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber',
                  tab.id === activeTab
                    ? 'border-amber text-amber'
                    : 'border-transparent text-ink-soft',
                )}
              >
                {tab.phoneLabel}
              </button>
            )
          })}
          <button
            type="button"
            onClick={onAddCreator}
            aria-label="Add creator"
            className="cursor-pointer whitespace-nowrap border-0 border-t-2 border-transparent bg-amber pb-5.5 pt-4.5 font-head text-[12px] font-semibold uppercase tracking-[1.5px] text-ground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
          >
            + Add
          </button>
        </nav>
      </>
    )
  }

  return (
    <header className="grain-masthead flex h-16 items-center justify-between gap-6 border-b border-amber px-8">
      <div className="flex cursor-pointer items-baseline gap-3.5">
        <div className="whitespace-nowrap font-display text-[25px] uppercase tracking-[1px] text-amber text-shadow-stencil">
          Stray Shot
        </div>
        <div className="whitespace-nowrap font-head text-[14px] uppercase tracking-[3px] text-ink">
          Creator Tracker
        </div>
      </div>

      <nav className="flex gap-6.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={tab.id === activeTab ? 'page' : undefined}
            onClick={onSelectTab ? () => onSelectTab(tab.id) : undefined}
            /* border-0 then border-b-2, not border-none: border-none sets the
               style to none on every side, which removed the underline the
               active tab is drawn with. */
            className={joinClassNames(
              'cursor-pointer border-0 border-b-2 bg-transparent px-0.5 pb-1 pt-1.5 font-head text-[13px] uppercase tracking-[2px] focus-visible:outline-2 focus-visible:outline-amber',
              tab.id === activeTab
                ? 'border-amber text-amber'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-5">
        {/* Dropped between md and lg, where the one row has no room for it;
            it is the least-used thing in the masthead. */}
        <a
          href="#"
          className="hidden shrink overflow-hidden text-ellipsis whitespace-nowrap text-[13px] uppercase tracking-[1px] text-ink-muted hover:text-amber lg:block"
        >
          Public page ↗
        </a>
        <Button variant="primary" onClick={onAddCreator}>
          + Add creator
        </Button>
      </div>
    </header>
  )
}
