import { Button } from '@/ui'

/* The masthead. The tabs switch the screen below; which one is showing is
   the shell's state.

   Layout: one row from md up, exactly as the design was reviewed. On a phone
   it becomes two rows — wordmark and the primary action, then the tabs with
   the public page link opposite them — rather than three stacked bands.

   The actions wrapper is `display: contents` below md, so the link and the
   button leave the group and become items of the masthead's own flex row,
   free to sit on different lines. From md up the wrapper becomes a real flex
   box again and the two sit together at the far right, which is what keeps
   the desktop masthead identical to the design. */

/** The screens the tabs choose between. */
export type AppTab = 'overview' | 'payments'

const tabs: { id: AppTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'payments', label: 'Payments' },
]

export function AppMasthead({
  activeTab = 'overview',
  onSelectTab,
  onAddCreator,
}: {
  activeTab?: AppTab
  onSelectTab?: (tab: AppTab) => void
  onAddCreator?: () => void
}) {
  return (
    <header className="grain-masthead border-b border-amber px-4 md:px-8">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5 md:h-16 md:flex-nowrap md:justify-between md:gap-6 md:py-0">
        <div className="order-1 flex cursor-pointer items-baseline gap-2.5 md:gap-3.5">
          <div className="font-display text-[22px] uppercase tracking-[1px] text-amber text-shadow-stencil whitespace-nowrap md:text-[25px]">
            Stray Shot
          </div>
          <div className="font-head text-[12px] uppercase tracking-[2px] text-ink whitespace-nowrap md:text-[14px] md:tracking-[3px]">
            Creator Tracker
          </div>
        </div>

        <div className="contents md:order-3 md:flex md:items-center md:gap-5">
          <a
            href="#"
            className="order-5 ml-auto overflow-hidden text-ellipsis whitespace-nowrap text-[12px] uppercase tracking-[1px] text-ink-muted hover:text-amber md:order-0 md:ml-0 md:text-[13px]"
          >
            Public page ↗
          </a>
          <Button
            variant="primary"
            onClick={onAddCreator}
            className="order-2 ml-auto md:order-0 md:ml-0"
          >
            + Add creator
          </Button>
        </div>

        {/* Forces the tabs onto their own line on a phone. Removed from the
            layout entirely from md up, where everything shares one row. */}
        <div aria-hidden="true" className="order-3 w-full md:hidden" />

        <nav className="order-4 flex gap-6 md:order-2 md:gap-6.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={tab.id === activeTab ? 'page' : undefined}
              onClick={onSelectTab ? () => onSelectTab(tab.id) : undefined}
              className={
                'cursor-pointer border-none bg-transparent px-0.5 pb-1 pt-1.5 font-head text-[13px] uppercase tracking-[2px] ' +
                (tab.id === activeTab
                  ? 'border-b-2 border-amber text-amber'
                  : 'border-b-2 border-transparent text-ink-muted hover:text-ink')
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
