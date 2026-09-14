import { useState } from 'react'
import type { Campaign, Creator } from '@/data/types'
import { getCampaignBudgetPosition } from '@/domain/campaignBudget'
import {
  draftFromCampaign,
  reviewCampaignDraft,
  type CampaignDraft,
  type CampaignProblem,
} from '@/domain/campaigns'
import { joinClassNames } from '@/lib/classNames'
import { formatMoney } from '@/lib/format'
import { Button, Label, Modal } from '@/ui'

/**
 * Creating a campaign, and editing one that exists.
 *
 * One form for both, because they collect exactly the same five things and a
 * second component would only be the first one with different copy. What
 * changes between them is the title, the button, and whether a name collides
 * with itself.
 *
 * Renaming is safe here in a way it would not have been a week ago: creators
 * point at a campaign by id, so a new name is a change to one record rather
 * than a rewrite of every creator on it.
 *
 * The budget field says what is already committed against it while it is
 * being typed. A budget below that saves anyway -- the deals under it were
 * agreed and refusing the edit would not unagree them -- but nobody should
 * have to leave the form to find out they have just put the campaign over.
 */

/** The domain returns codes; the wording of them belongs here. */
const problemMessages: Record<CampaignProblem, string> = {
  'name-missing': 'Give the campaign a name.',
  'name-taken': 'Another campaign already has that name.',
  'start-missing': 'Choose the date the campaign starts.',
  'end-missing': 'Choose the date the campaign ends.',
  'dates-unreadable': 'Those dates cannot be read. Use the pickers, or type them as YYYY-MM-DD.',
  'end-before-start': 'The end date is before the start date.',
  'budget-unreadable': 'Enter the budget in dollars and cents, such as 30000 or 30,000.50.',
  'target-unreadable':
    'Enter the target in dollars and cents, such as 3.50. No fractions of a cent.',
}

const emptyDraft: CampaignDraft = {
  name: '',
  startDate: '',
  endDate: '',
  totalBudget: '',
  targetCostPerInstall: '',
}

export function CampaignModal({
  campaigns,
  creators,
  editing,
  onSave,
  onClose,
}: {
  /** Everything already saved, so a duplicate name can be spotted. */
  campaigns: Campaign[]
  /** Every creator, to say what the campaign being edited has committed. */
  creators: Creator[]
  /** The campaign being edited, or undefined when creating a new one. */
  editing?: Campaign
  onSave: (draft: CampaignDraft) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<CampaignDraft>(
    editing ? draftFromCampaign(editing) : emptyDraft,
  )
  const [hasTriedToSave, setHasTriedToSave] = useState(false)

  const review = reviewCampaignDraft(draft, campaigns, editing?.id)

  /* Only a campaign that exists has deals on it. A new one has committed
     nothing by definition, so the line would say nothing worth reading. */
  const committed = editing ? getCampaignBudgetPosition(editing, creators).committedInCents : null
  const showProblems = hasTriedToSave && review.problems.length > 0

  const update = (field: keyof CampaignDraft) => (value: string) =>
    setDraft((current) => ({ ...current, [field]: value }))

  function handleSave() {
    setHasTriedToSave(true)
    if (review.canSave) onSave(draft)
  }

  return (
    <Modal
      title={editing ? 'Edit campaign' : 'Create campaign'}
      subtitle={
        editing
          ? 'Everyone on this campaign follows the changes.'
          : 'The dashboard filters by campaign, so this is what creators get grouped under.'
      }
      labelId="campaign-modal-title"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editing ? 'Save changes' : 'Create campaign'}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="mb-1.5">Campaign name</Label>
          <input
            value={draft.name}
            onChange={(event) => update('name')(event.target.value)}
            placeholder="e.g. Winter Offensive"
            aria-label="Campaign name"
            className="w-full border border-hair bg-sunk px-3 py-2.5 text-[14px] text-ink"
          />
        </div>

        <div>
          <Label className="mb-1.5">Starts</Label>
          <input
            type="date"
            value={draft.startDate}
            onChange={(event) => update('startDate')(event.target.value)}
            aria-label="Start date"
            className="w-full border border-hair bg-sunk px-3 py-2.5 text-[14px] text-ink"
          />
        </div>

        <div>
          <Label className="mb-1.5">Ends</Label>
          <input
            type="date"
            value={draft.endDate}
            onChange={(event) => update('endDate')(event.target.value)}
            aria-label="End date"
            className="w-full border border-hair bg-sunk px-3 py-2.5 text-[14px] text-ink"
          />
        </div>

        <div>
          <Label className="mb-1.5">Total budget ($)</Label>
          <input
            value={draft.totalBudget}
            onChange={(event) => update('totalBudget')(event.target.value)}
            inputMode="decimal"
            aria-label="Total budget in dollars"
            className="w-full border border-hair bg-sunk px-3 py-2.5 text-[14px] text-ink"
          />
          {committed !== null && (
            <p
              className={joinClassNames(
                'mt-1.5 text-[12px]',
                review.totalBudgetInCents !== null && committed > review.totalBudgetInCents
                  ? 'text-bad'
                  : 'text-ink-muted',
              )}
              role="status"
            >
              {describeCommitment(committed, review.totalBudgetInCents)}
            </p>
          )}
        </div>

        <div>
          <Label className="mb-1.5">Target cost / install ($)</Label>
          <input
            value={draft.targetCostPerInstall}
            onChange={(event) => update('targetCostPerInstall')(event.target.value)}
            inputMode="decimal"
            aria-label="Target cost per install in dollars"
            className="w-full border border-amber bg-sunk px-3 py-2.5 text-[14px] font-semibold text-amber"
          />
        </div>
      </div>

      <p className="mt-4 text-[13px] text-ink-muted" role="status">
        The target sets where cost per install turns green or red for everyone on this campaign.
      </p>

      {showProblems && (
        <ul className="mt-3 list-none text-[13px] text-bad" role="alert">
          {review.problems.map((problem) => (
            <li key={problem}>{problemMessages[problem]}</li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

/** The live line under the budget field: what this budget means for the deals
 * already agreed against it. */
function describeCommitment(committedInCents: number, budgetInCents: number | null): string {
  const committed = `${formatMoney(committedInCents)} is already committed on this campaign`

  if (budgetInCents === null) return `${committed}.`

  if (committedInCents > budgetInCents) {
    return `${committed} — ${formatMoney(committedInCents - budgetInCents)} more than this budget. It will save, and show as over budget.`
  }

  return `${committed}, leaving ${formatMoney(budgetInCents - committedInCents)} of this budget.`
}
