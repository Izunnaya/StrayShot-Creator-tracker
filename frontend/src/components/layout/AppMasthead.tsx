import { Button } from "../../ui";

/* Static masthead — task 0.14. The tabs render their selected state but do not
   switch views yet; that is Phase 3.

   Layout: one row from md up, exactly as the design was reviewed. Below that
   the three groups stack instead of competing for a single 64px row —
   wordmark, then the actions, then the tabs. Nothing is hidden on a phone:
   the whole masthead is four controls, and dropping any of them to save
   vertical space would cost more than the row it saved. */

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "payments", label: "Payments" },
];

export function AppMasthead({ activeTab = "overview" }: { activeTab?: string }) {
  return (
    <header className="grain-masthead border-b border-amber px-4 md:px-8">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 py-3 md:h-16 md:flex-nowrap md:justify-between md:gap-6 md:py-0">
        <div className="order-1 flex cursor-pointer items-baseline gap-2.5 md:gap-3.5">
          <div className="font-display text-[22px] uppercase tracking-[1px] text-amber text-shadow-stencil whitespace-nowrap md:text-[25px]">
            Stray Shot
          </div>
          <div className="font-head text-[12px] uppercase tracking-[2px] text-ink whitespace-nowrap md:text-[14px] md:tracking-[3px]">
            Creator Tracker
          </div>
        </div>

        <div className="order-2 flex w-full items-center justify-between gap-4 md:order-3 md:w-auto md:justify-end md:gap-5">
          <a
            href="#"
            className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] uppercase tracking-[1px] text-ink-muted hover:text-amber"
          >
            Public page ↗
          </a>
          <Button variant="primary">+ Add creator</Button>
        </div>

        <nav className="order-3 flex w-full gap-6.5 border-t border-hair pt-2 md:order-2 md:w-auto md:border-0 md:pt-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={
                "cursor-pointer border-none bg-transparent px-0.5 pb-1 pt-1.5 font-head text-[13px] uppercase tracking-[2px] " +
                (tab.id === activeTab
                  ? "border-b-2 border-amber text-amber"
                  : "border-b-2 border-transparent text-ink-muted hover:text-ink")
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
