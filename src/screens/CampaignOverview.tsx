import {
  campaigns,
  cpiOf,
  creators,
  dailyInstalls,
  defaultTargetCpi,
  paidOf,
  remainingOf,
  statusOf,
  streamDays,
  weekLabels,
} from '../data/fixtures'
import type { Creator, CreatorStatus } from '../data/types'
import { compactViews, cpiLabel, money, num } from '../lib/format'
import {
  Button,
  Chip,
  Label,
  Panel,
  PlatformTag,
  ProgressBar,
  SectionTitle,
  StatStrip,
  StatTile,
  StatusPill,
} from '../ui'

/* Campaign overview, static — tasks 2.9 to 2.13.
   Filters and sorting render their selected state but do not respond to
   clicks yet; wiring them up is Phase 3 (2.18, 2.21). */

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/* The row and header share one column definition so labels sit over values. */
const COLUMNS = 'grid-cols-[1.5fr_0.95fr_0.8fr_0.65fr_0.75fr_0.9fr_0.9fr_0.8fr_1.45fr_0.95fr]'

const columnLabels = [
  'Creator',
  'Status',
  'Platform',
  'Code',
  'Streams',
  'Views',
  'Peak',
  'Installs',
  'Paid / agreed',
  'Cost / install',
]

const sortedByCpi = [...creators].sort((a, b) => cpiOf(a) - cpiOf(b))

const totals = {
  paid: creators.reduce((a, c) => a + paidOf(c), 0),
  contract: creators.reduce((a, c) => a + c.contract, 0),
  open: creators.reduce((a, c) => a + remainingOf(c), 0),
  installs: creators.reduce((a, c) => a + c.installs, 0),
  views: creators.reduce((a, c) => a + c.views, 0),
  owedCount: creators.filter((c) => remainingOf(c) > 0).length,
}

const statusCounts = (status: CreatorStatus) => creators.filter((c) => statusOf(c) === status).length

/** Green at or under target, white up to 1.6x, red beyond. Grey when nothing paid. */
function cpiTone(cpi: number) {
  if (!Number.isFinite(cpi)) return 'text-ink-muted'
  if (cpi <= defaultTargetCpi) return 'text-good bg-good/10'
  if (cpi <= defaultTargetCpi * 1.6) return 'text-ink'
  return 'text-bad bg-bad/10'
}

/* ------------------------------------------------------------------ chart */

const CHART_MAX = 1000
const points = dailyInstalls
  .map((v, i) => {
    const x = ((i / (dailyInstalls.length - 1)) * 1000).toFixed(1)
    const y = (188 - (v / CHART_MAX) * 172).toFixed(1)
    return `${x},${y}`
  })
  .join(' ')
const areaPath = `M0,190 L${points.split(' ').join(' L')} L1000,190 Z`

function InstallsChart() {
  return (
    <>
      <svg
        width="100%"
        height="200"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        className="block"
        role="img"
        aria-label="Installs per day over the last six weeks, with stream days marked"
      >
        {[15, 73, 131].map((y) => (
          <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#242424" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <line x1="0" y1="190" x2="1000" y2="190" stroke="#2A2A2A" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {streamDays.map(([i, code], n) => {
          const x = ((i / (dailyInstalls.length - 1)) * 1000).toFixed(1)
          return (
            <line
              key={`${code}-${n}`}
              x1={x}
              x2={x}
              y1="8"
              y2="190"
              stroke="rgba(255,194,10,0.35)"
              strokeWidth="1"
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
        <path d={areaPath} fill="rgba(255,194,10,0.07)" />
        <polyline points={points} fill="none" stroke="#FFC20A" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="relative mt-[6px] h-[16px]">
        {streamDays.map(([i, code], n) => (
          <span
            key={`${code}-label-${n}`}
            className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[1px] text-amber-dim"
            style={{ left: (i / (dailyInstalls.length - 1)) * 100 + '%' }}
          >
            {code}
          </span>
        ))}
      </div>

      <div className="mt-[8px] flex justify-between">
        {weekLabels.map((w) => (
          <span key={w} className="text-[11px] text-ink-muted">
            {w}
          </span>
        ))}
      </div>
    </>
  )
}

/* -------------------------------------------------------------- table row */

function CreatorRow({ creator }: { creator: Creator }) {
  const paid = paidOf(creator)
  const open = remainingOf(creator)
  const cpi = cpiOf(creator)
  const pct = creator.contract ? (paid / creator.contract) * 100 : 0

  return (
    <div
      className={cx(
        'grid items-center border-t border-hair-4 px-[18px] py-[13px] text-[14px] cursor-pointer hover:bg-row-hover',
        COLUMNS,
      )}
      style={{ minWidth: 1320 }}
    >
      <div className="font-semibold text-ink">{creator.name}</div>
      <div>
        <StatusPill status={statusOf(creator)} />
      </div>
      <div>
        <PlatformTag platform={creator.platform} />
      </div>
      <div className="font-semibold tracking-[1px] text-amber">{creator.code}</div>
      <div className="text-ink-muted">
        {creator.streams} / {creator.agreed}
      </div>
      <div>{num(creator.views)}</div>
      <div className="text-ink-muted">{num(creator.peak)}</div>
      <div className="font-semibold">{num(creator.installs)}</div>
      <div className="pr-[22px]">
        <div className="mb-[5px] flex justify-between gap-[10px] text-[13px]">
          <span className="whitespace-nowrap">
            {money(paid)} / {money(creator.contract)}
          </span>
          <span className="whitespace-nowrap text-ink-muted">
            {open > 0 ? `${money(open)} open` : 'Settled'}
          </span>
        </div>
        <ProgressBar pct={pct} />
      </div>
      <div>
        <span className={cx('px-[9px] py-[3px] font-semibold', cpiTone(cpi))}>{cpiLabel(cpi)}</span>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- screen */

export function CampaignOverview() {
  const openRows = creators.filter((c) => c.streams >= c.agreed && remainingOf(c) > 0)
  const undelivered = creators.filter((c) => c.streams < c.agreed && paidOf(c) > 0)

  return (
    <div className="mx-auto max-w-[1280px] px-[32px] pb-[48px] pt-[28px]">
      <div className="mb-[24px]">
        <StatStrip>
          <StatTile
            label="Paid to date"
            value={money(totals.paid)}
            note={`of ${money(totals.contract)} committed`}
          />
          <StatTile
            label="Outstanding"
            value={money(totals.open)}
            note={`across ${totals.owedCount} creators`}
            tone="bad"
          />
          <StatTile
            label="Total installs"
            value={num(totals.installs)}
            note={`${compactViews(totals.views)} views`}
          />
          <StatTile
            label="Blended cost / install"
            value={'$' + (totals.paid / totals.installs).toFixed(2)}
            note="on money actually paid"
            tone="amber"
          />
        </StatStrip>
      </div>

      <div className="mb-[16px] flex flex-wrap items-center gap-[8px]">
        <Label className="mr-[6px]">Campaign</Label>
        <Chip label="All campaigns" selected />
        {campaigns.map((c) => (
          <Chip key={c.id} label={c.name} />
        ))}
        <Button variant="dashed">+ New campaign</Button>
      </div>

      <div className="mb-[16px] flex flex-wrap items-center gap-[8px]">
        <Label className="mr-[6px]">Status</Label>
        <Chip label="All" count={creators.length} selected />
        <Chip label="Prospect" count={statusCounts('prospect')} />
        <Chip label="Contracted" count={statusCounts('contracted')} />
        <Chip label="Active" count={statusCounts('active')} />
        <Chip label="Completed" count={statusCounts('completed')} />
      </div>

      <div className="mb-[24px] overflow-x-auto border border-hair bg-panel">
        <div
          className={cx('grid border-b border-hair bg-panel-head px-[18px]', COLUMNS)}
          style={{ minWidth: 1320 }}
        >
          {columnLabels.map((label) => {
            const sorted = label === 'Cost / install'
            return (
              <div
                key={label}
                className={cx(
                  'cursor-pointer select-none whitespace-nowrap py-[11px] pr-[12px] text-[11px] uppercase tracking-[1.5px] hover:text-amber',
                  sorted ? 'text-amber' : 'text-ink-muted',
                )}
              >
                {label}
                {sorted && ' ▲'}
              </div>
            )
          })}
        </div>
        {sortedByCpi.map((c) => (
          <CreatorRow key={c.id} creator={c} />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.55fr_1fr]">
        <Panel className="px-[22px] py-[20px]">
          <div className="mb-[16px] flex items-baseline justify-between">
            <SectionTitle>
              Installs <span className="text-amber">over time</span>
            </SectionTitle>
            <div className="text-[12px] text-ink-muted">
              Dashed lines mark stream days · last 6 weeks
            </div>
          </div>
          <InstallsChart />
        </Panel>

        <div className="grid gap-[24px]">
          <Panel className="px-[20px] py-[18px]">
            <div className="mb-[6px] flex items-baseline justify-between">
              <SectionTitle size="sm">
                Delivered, <span className="text-bad">payment open</span>
              </SectionTitle>
              <div className="text-[12px] text-ink-muted">{money(totals.open)} total</div>
            </div>
            {openRows.map((c) => {
              const paid = paidOf(c)
              const open = remainingOf(c)
              const pct = (paid / c.contract) * 100
              const partial = paid > 0
              return (
                <div key={c.id} className="border-t border-hair-3 pb-[13px] pt-[12px]">
                  <div className="flex items-baseline justify-between gap-[10px]">
                    <span className="text-[14px] font-semibold">{c.name}</span>
                    <span
                      className={cx(
                        'whitespace-nowrap px-[7px] py-[2px] text-[11px] font-semibold uppercase tracking-[1px]',
                        partial ? 'bg-amber/10 text-amber' : 'bg-bad/12 text-bad',
                      )}
                    >
                      {partial ? `${Math.round(pct)}% settled` : 'Nothing paid'}
                    </span>
                  </div>
                  <div className="my-[9px] mb-[7px]">
                    <ProgressBar pct={pct} height={5} />
                  </div>
                  <div className="flex items-center justify-between gap-[10px]">
                    <span className="text-[12px] text-ink-muted">
                      {money(paid)} of {money(c.contract)} · {money(open)} open
                    </span>
                    <Button variant="outline">Record payment</Button>
                  </div>
                </div>
              )
            })}
          </Panel>

          <Panel className="px-[20px] py-[18px]">
            <SectionTitle size="sm" className="mb-[12px]">
              Paid, not delivered
            </SectionTitle>
            {undelivered.map((c) => {
              const due = c.agreed - c.streams
              return (
                <div
                  key={c.id}
                  className="flex justify-between border-t border-hair-3 py-[8px] text-[14px]"
                >
                  <span>{c.name}</span>
                  <span className="text-ink-muted">
                    {money(paidOf(c))} paid · {due} stream{due > 1 ? 's' : ''} due
                  </span>
                </div>
              )
            })}
          </Panel>
        </div>
      </div>
    </div>
  )
}
