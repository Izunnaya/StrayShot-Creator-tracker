import { useState } from 'react'
import type { Campaign, Creator } from '@/data/types'
import {
  draftFromCreator,
  emptyCreatorDraft,
  getTrackingLink,
  hasUnsavedChanges,
  reviewCreatorDraft,
  type CreatorDraft,
  type CreatorFormStep,
  type CreatorProblem,
} from '@/domain/creatorRecording'
import { joinClassNames } from '@/lib/classNames'
import { usePhoneLayout } from '@/lib/usePhoneLayout'
import { CreatorDealStep } from './CreatorDealStep'
import { CreatorIdentityStep } from './CreatorIdentityStep'
import { CreatorPaymentStep } from './CreatorPaymentStep'
import { PhoneText } from './PhoneText'
import { Button, fieldInputClasses, FormField, LabelNote, Modal } from '@/ui'

/**
 * Adding a creator, and editing one that exists.
 *
 * Three steps rather than one screen, because the record is built in stages:
 * the team meets someone before the deal is agreed, and the deal is agreed
 * before anyone knows how they will be paid. Step one saves on its own, so a
 * name and an email is a record rather than a note in a chat.
 *
 * The step bar is the whole point of the layout: records sit half-filled for
 * weeks, so it has to say at a glance which parts are done. Steps are
 * clickable in any order for the same reason — someone completing the deal a
 * month later should not have to walk back through step one.
 */

const STEPS: { id: CreatorFormStep; label: string; phoneLabel: string; hint: string }[] = [
  { id: 'identity', label: 'Who they are', phoneLabel: 'Who', hint: 'Name, email, channel' },
  { id: 'deal', label: 'The deal', phoneLabel: 'Deal', hint: 'Code, rate, commitment' },
  { id: 'payment', label: 'Payment details', phoneLabel: 'Payment', hint: 'How they get paid' },
]

/** What the button that moves on to each step says, as the design words it. */
const NEXT_LABELS: Record<CreatorFormStep, string> = {
  identity: 'Who they are',
  deal: 'The deal',
  payment: 'Payment',
}

const problemMessages: Record<CreatorProblem, string> = {
  'name-missing': 'Enter the creator’s name.',
  'email-missing': 'Enter an email — the portal invite is sent there.',
  'email-unreadable': 'That email does not look like an address.',
  'campaign-missing': 'Choose the campaign this deal belongs to.',
  'campaign-unknown': 'That campaign no longer exists. Choose one of the current campaigns.',
  'code-missing': 'Give them a code.',
  'code-unreadable': 'Codes are 2 to 8 letters or digits, with nothing in between.',
  'code-taken': 'Another creator already has that code.',
  'rate-missing': 'Enter the agreed rate.',
  'rate-unreadable':
    'Enter the rate in dollars and cents, such as 1800 or 1,800.50. No fractions of a cent.',
  'streams-missing': 'Enter how many streams they have committed to.',
  'streams-unreadable': 'Streams committed has to be a whole number.',
  'hours-unreadable': 'Minimum duration has to be a number of hours, such as 2 or 1.5.',
  'window-unreadable': 'Those dates cannot be read. Use the pickers, or type YYYY-MM-DD.',
  'window-backwards': 'The delivery window ends before it starts.',
}

/**
 * The payout currencies the design offers. Every figure in the tracker stays
 * in US dollars (DECISIONS.md, Q8); this is for whoever makes the transfer.
 */
const CURRENCIES = ['USD', 'EUR', 'GBP', 'BRL']

export function CreatorModal({
  campaigns,
  creators,
  editing,
  onSave,
  onSendInvite,
  onClose,
}: {
  campaigns: Campaign[]
  /** Everyone already recorded, so a duplicate code can be spotted. */
  creators: Creator[]
  editing?: Creator
  onSave: (draft: CreatorDraft, options?: { sendInvite?: boolean }) => void
  /**
   * Sends or resends the portal invite to the creator as saved.
   *
   * Only used while the form matches the record. With anything edited the
   * invite goes through onSave instead, so it cannot be addressed from a
   * record the form has already moved on from.
   */
  onSendInvite?: (creator: Creator) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<CreatorDraft>(
    editing ? draftFromCreator(editing) : { ...emptyCreatorDraft, campaignId: '' },
  )
  const [step, setStep] = useState<CreatorFormStep>('identity')
  const [hasTriedToSave, setHasTriedToSave] = useState(false)

  const review = reviewCreatorDraft(draft, { creators, campaigns, editingId: editing?.id })
  const visibleProblems = hasTriedToSave ? review.problems : []

  const update = (field: keyof CreatorDraft) => (value: string) =>
    setDraft((current) => ({ ...current, [field]: value }))

  /** What the form holds that the record does not. */
  const isEdited = editing ? hasUnsavedChanges(draft, editing) : false

  function handleSave(options?: { sendInvite?: boolean }) {
    setHasTriedToSave(true)
    if (review.canSave) onSave(draft, options)
  }

  /* Once a deal is being filled in, saving means saving a creator — even if
     the deal is not finished yet, in which case it refuses and says why.
     Promising "save as prospect" there would be a lie about what happens. */
  const saveLabel = editing
    ? 'Save changes'
    : review.dealStarted
      ? 'Save creator'
      : 'Save as prospect'

  const currencies = CURRENCIES.includes(draft.payoutCurrency)
    ? CURRENCIES
    : [draft.payoutCurrency, ...CURRENCIES].filter(Boolean)

  const inviteState = editing ? editing.portalInviteState : 'not sent'
  const isPhone = usePhoneLayout()

  return (
    <Modal
      title={editing ? 'Edit creator' : 'Add creator'}
      aside="Steps 2 and 3 can be filled in later"
      labelId="creator-modal-title"
      width="wide"
      onClose={onClose}
      footer={
        /* From md up: Cancel on the left; Back, save and next on the right,
           the next step as the main action. On a phone the two ways forward
           share a row, Back sits under them, and Cancel is a quiet text
           button beneath the lot. Chosen in script rather than hidden with
           CSS, so the form never holds two of each button. */
        !isPhone ? (
          <div className="flex items-center justify-between gap-3">
            <Button variant="cancel" size="dialog" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              {step !== 'identity' && (
                <Button
                  variant="secondary"
                  size="dialog"
                  onClick={() => setStep(previousStep(step))}
                >
                  ← Back
                </Button>
              )}
              <Button variant="outline" size="dialog" onClick={() => handleSave()}>
                {saveLabel}
              </Button>
              {step !== 'payment' && (
                <Button variant="primary" size="dialog" onClick={() => setStep(nextStep(step))}>
                  {NEXT_LABELS[nextStep(step)]} →
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" size="block" onClick={() => handleSave()}>
                {saveLabel}
              </Button>
              {step !== 'payment' && (
                <Button variant="primary" size="block" onClick={() => setStep(nextStep(step))}>
                  {NEXT_LABELS[nextStep(step)]} →
                </Button>
              )}
              {step !== 'identity' && (
                <Button
                  variant="secondary"
                  size="block"
                  onClick={() => setStep(previousStep(step))}
                >
                  ← Back
                </Button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2.5 min-h-11 w-full cursor-pointer border-none bg-transparent py-3 text-[13px] uppercase tracking-[1px] text-ink-dim hover:text-ink focus-visible:outline-2 focus-visible:outline-amber"
            >
              Cancel
            </button>
          </div>
        )
      }
    >
      <div className="mb-4.5 grid grid-cols-3 gap-px border border-hair bg-hair md:mb-5.5">
        {STEPS.map((entry, index) => {
          const active = step === entry.id
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setStep(entry.id)}
              aria-current={active ? 'step' : undefined}
              /* Named for the step, so it is distinguishable from the footer
                 control that moves to the same step. */
              aria-label={`Step ${index + 1}: ${entry.label}, ${
                review.completeByStep[entry.id] ? 'complete' : 'incomplete'
              }`}
              className={joinClassNames(
                'flex min-h-11.5 cursor-pointer flex-col items-center justify-center border-0 border-b-2 px-1.5 py-3.25 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber md:items-stretch md:px-3.5 md:py-3',
                active
                  ? 'border-amber bg-step-tab-active text-ink'
                  : 'border-transparent bg-step-tab text-ink-muted hover:bg-row-hover',
              )}
            >
              <span className="flex items-center gap-1.75 md:gap-2">
                <StepMark
                  complete={review.completeByStep[entry.id]}
                  active={active}
                  number={index + 1}
                />
                <span className="font-head text-[11px] uppercase tracking-[1px] md:text-[12px] md:tracking-[1.5px]">
                  <span className="md:hidden">{entry.phoneLabel}</span>
                  <span className="hidden md:inline">{entry.label}</span>
                </span>
              </span>
              <span className="mt-1 hidden text-left text-[11px] text-ink-soft md:block">
                {entry.hint}
              </span>
            </button>
          )
        })}
      </div>

      {step === 'identity' && <CreatorIdentityStep draft={draft} update={update} />}

      {step === 'deal' && (
        <CreatorDealStep
          draft={draft}
          update={update}
          campaigns={campaigns}
          currencies={currencies}
        />
      )}

      {step === 'payment' && <CreatorPaymentStep draft={draft} update={update} />}

      {/* Not a step: these belong to the creator, not to a stage of filling
          the form in, and the team refers to them from any of the three. */}
      <div className="mt-4.5 border-t border-hair pt-4 md:mt-5.5 md:pt-4.5">
        <div className="grid items-start gap-3.5 md:grid-cols-[1.3fr_1fr] md:gap-4.5">
          <FormField label="Tracking link">
            <div
              className={joinClassNames(
                'border border-hair bg-sunk-2 px-3 py-2.5 font-mono text-[13px]',
                editing ? 'text-amber' : 'italic text-ink-faint',
              )}
            >
              {editing ? getTrackingLink(editing) : 'Generated on save'}
            </div>
          </FormField>

          <FormField label="Invite status">
            <div className="flex items-center gap-2.5">
              <span
                className={joinClassNames(
                  'whitespace-nowrap border border-hair px-2.25 py-1 text-[11px] font-semibold uppercase tracking-[1px]',
                  inviteState === 'claimed'
                    ? 'text-good'
                    : inviteState === 'sent'
                      ? 'text-amber'
                      : 'text-ink-muted',
                )}
              >
                {inviteState}
              </span>
              {editing && onSendInvite ? (
                /* An edited form is saved before the invite goes, and the
                   button says so. Sending from the record as it stands would
                   address the invite to the email being corrected -- which is
                   the one reason anyone is on this field. */
                <Button
                  variant="outline"
                  onClick={
                    isEdited ? () => handleSave({ sendInvite: true }) : () => onSendInvite(editing)
                  }
                >
                  {inviteButtonLabel(editing.portalInviteState, isEdited)}
                </Button>
              ) : (
                /* A creator who does not exist yet has nowhere to send an
                   invite from, so saving and sending is one action. It
                   refuses like any other save if the email is missing, which
                   is the address the invite would have gone to. */
                <Button variant="outline" onClick={() => handleSave({ sendInvite: true })}>
                  Save and send invite
                </Button>
              )}
            </div>
            {isEdited && (
              <p className="mt-1.5 text-[12px] text-ink-muted">
                The invite goes to the email as it now reads, once these changes are saved.
              </p>
            )}
          </FormField>
        </div>

        <FormField
          label={
            <>
              Notes
              <LabelNote>
                <PhoneText wide="team only, never shown to the creator" phone="team only" />
              </LabelNote>
            </>
          }
          className="mt-3.5 md:mt-3.75"
        >
          <textarea
            value={draft.notes}
            onChange={(event) => update('notes')(event.target.value)}
            rows={2}
            aria-label="Notes"
            className={joinClassNames(fieldInputClasses, 'resize-y')}
          />
        </FormField>
      </div>

      {visibleProblems.length > 0 && (
        <ul className="mt-4 list-none text-[13px] text-bad" role="alert">
          {visibleProblems.map((problem) => (
            <li key={problem}>{problemMessages[problem]}</li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

/** A tick once the step holds everything it is for, its number until then. */
function StepMark({
  complete,
  active,
  number,
}: {
  complete: boolean
  active: boolean
  number: number
}) {
  return (
    <span
      aria-hidden="true"
      className={joinClassNames(
        'inline-flex h-4.25 w-4.25 shrink-0 items-center justify-center text-[10px] font-bold md:h-4.5 md:w-4.5 md:text-[11px]',
        complete
          ? 'bg-good text-ground'
          : active
            ? 'bg-amber text-ground'
            : 'border border-hair-6 text-ink-muted',
      )}
    >
      {complete ? '✓' : number}
    </span>
  )
}

function nextStep(step: CreatorFormStep): CreatorFormStep {
  return step === 'identity' ? 'deal' : 'payment'
}

function previousStep(step: CreatorFormStep): CreatorFormStep {
  return step === 'payment' ? 'deal' : 'identity'
}

/** Says what pressing it will do, saving included. */
function inviteButtonLabel(inviteState: Creator['portalInviteState'], isEdited: boolean): string {
  const send = inviteState === 'not sent' ? 'Send invite' : 'Resend'
  return isEdited ? `Save and ${send.toLowerCase()}` : send
}
