import { Button } from "../ui";

/* Static masthead — task 0.14. The tabs render their selected state but do not
   switch views yet; that is Phase 3. */

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "payments", label: "Payments" },
];

export function Masthead({ active = "overview" }: { active?: string }) {
  return (
    <header className="grain-masthead flex h-[64px] items-center justify-between border-b border-amber px-[32px]">
      <div className="flex cursor-pointer items-baseline gap-[14px]">
        <div className="font-display text-[25px] uppercase tracking-[1px] text-amber text-shadow-stencil whitespace-nowrap">
          Stray Shot
        </div>
        <div className="font-head text-[14px] uppercase tracking-[3px] text-ink whitespace-nowrap">
          Creator Tracker
        </div>
      </div>

      <nav className="flex gap-[26px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={
              "cursor-pointer border-none bg-transparent px-0.5 pb-1 pt-1.5 font-head text-[13px] uppercase tracking-[2px] " +
              (tab.id === active
                ? "border-b-2 border-amber text-amber"
                : "border-b-2 border-transparent text-ink-muted hover:text-ink")
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-[20px]">
        <a
          href="#"
          className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] uppercase tracking-[1px] text-ink-muted hover:text-amber"
        >
          Public page ↗
        </a>
        <Button variant="primary">+ Add creator</Button>
      </div>
    </header>
  );
}
