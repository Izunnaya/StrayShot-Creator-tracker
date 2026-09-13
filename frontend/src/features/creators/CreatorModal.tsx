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
import { Button, Label, Modal } from '@/ui'

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

const STEPS: { id: CreatorFormStep; label: string; hint: string }[] = [
  { id: 'identity', label: 'Who they are', hint: 'Name, email, channel' },
  { id: 'deal', label: 'The deal', hint: 'Code, rate, commitment' },
  { id: 'payment', label: 'Payment details', hint: 'How they get paid' },
]

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

const LANGUAGES = ['English', 'Spanish', 'Portuguese', 'German', 'French', 'Japanese']
const REGIONS = [
  'United States',
  'United Kingdom',
  'Canada',
  'Brazil',
  'Germany',
  'Japan',
  'Philippines',
]
const PAYMENT_METHODS = ['Bank transfer', 'PayPal', 'Crypto', 'Other']

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

  return (
    <Modal
      title={editing ? 'Edit creator' : 'Add creator'}
      subtitle="Steps 2 and 3 can be filled in later."
      labelId="creator-modal-title"
      onClose={onClose}
      footer={
        <div className="grid gap-2 sm:flex sm:flex-row-reverse sm:items-center sm:justify-between sm:gap-3">
          <div className="flex gap-2 sm:gap-3">
            {step !== 'identity' && (
              <Button
                variant="secondary"
                onClick={() => setStep(previousStep(step))}
                className="flex-1 sm:flex-none"
              >
                ← Back
              </Button>
            )}
            {step !== 'payment' && (
              <Button
                variant="outline"
                onClick={() => setStep(nextStep(step))}
                className="flex-1 sm:flex-none"
              >
                {STEPS[STEPS.findIndex((entry) => entry.id === step) + 1]!.label} →
              </Button>
            )}
            <Button variant="primary" onClick={() => handleSave()} className="flex-1 sm:flex-none">
              {saveLabel}
            </Button>
          </div>

          <Button variant="secondary" onClick={onClose} className="sm:order-first">
            Cancel
          </Button>
        </div>
      }
    >
      <div className="mb-5 grid grid-cols-3 gap-px border border-hair bg-hair">
        {STEPS.map((entry, index) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setStep(entry.id)}
            aria-current={step === entry.id ? 'step' : undefined}
            /* Named for the step, so it is distinguishable from the footer
               control that moves to the same step. */
            aria-label={`Step ${index + 1}: ${entry.label}`}
            className={joinClassNames(
              'cursor-pointer border-none px-2 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-amber sm:px-3.5 sm:py-3',
              step === entry.id ? 'bg-row-hover' : 'bg-panel-head hover:bg-row-hover',
            )}
          >
            <span className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <StepMark
                complete={review.completeByStep[entry.id]}
                active={step === entry.id}
                number={index + 1}
              />
              <span
                className={joinClassNames(
                  'font-head text-[12px] uppercase tracking-[1.5px]',
                  step === entry.id ? 'text-ink' : 'text-ink-muted',
                )}
              >
                {entry.label}
              </span>
            </span>
            {/* The hint is guidance, not information: on a phone the three
                labels already fill the row. */}
            <span className="mt-1 hidden text-[11px] text-ink-soft sm:block">{entry.hint}</span>
          </button>
        ))}
      </div>

      {step === 'identity' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Creator name">
            <input
              value={draft.name}
              onChange={(event) => update('name')(event.target.value)}
              aria-label="Creator name"
              className={inputClasses}
            />
          </Field>

          <Field label="Email · required">
            <input
              value={draft.email}
              onChange={(event) => update('email')(event.target.value)}
              placeholder="the invite is sent here"
              aria-label="Email"
              className={inputClasses}
            />
          </Field>

          <Field label="Platform">
            <select
              value={draft.platform}
              onChange={(event) => update('platform')(event.target.value)}
              aria-label="Platform"
              className={inputClasses}
            >
              <option value="YouTube">YouTube</option>
              <option value="Twitch">Twitch</option>
            </select>
          </Field>

          <Field label="Channel URL or ID">
            <input
              value={draft.channelUrl}
              onChange={(event) => update('channelUrl')(event.target.value)}
              aria-label="Channel URL or ID"
              className={inputClasses}
            />
          </Field>

          <Field label="Audience size">
            <input
              value={draft.audienceSize}
              onChange={(event) => update('audienceSize')(event.target.value)}
              placeholder="e.g. 412K"
              aria-label="Audience size"
              className={inputClasses}
            />
          </Field>

          <Field label="Preferred contact handle">
            <input
              value={draft.contactHandle}
              onChange={(event) => update('contactHandle')(event.target.value)}
              placeholder="Telegram or Discord"
              aria-label="Preferred contact handle"
              className={inputClasses}
            />
          </Field>

          <Field label="Content language">
            <select
              value={draft.contentLanguage}
              onChange={(event) => update('contentLanguage')(event.target.value)}
              aria-label="Content language"
              className={inputClasses}
            >
              <option value="">—</option>
              {LANGUAGES.map((language) => (
                <option key={language}>{language}</option>
              ))}
            </select>
          </Field>

          <Field label="Country or region">
            <select
              value={draft.region}
              onChange={(event) => update('region')(event.target.value)}
              aria-label="Country or region"
              className={inputClasses}
            >
              <option value="">—</option>
              {REGIONS.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {step === 'deal' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Campaign" className="sm:col-span-2">
            <select
              value={draft.campaignId}
              onChange={(event) => update('campaignId')(event.target.value)}
              aria-label="Campaign"
              className={inputClasses}
            >
              <option value="">—</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={String(campaign.id)}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Assigned code">
            <input
              value={draft.creatorCode}
              onChange={(event) => update('creatorCode')(event.target.value.toUpperCase())}
              aria-label="Assigned code"
              className={joinClassNames(
                inputClasses,
                'border-amber font-semibold tracking-[2px] text-amber',
              )}
            />
          </Field>

          <Field label="Rate model">
            <select
              value={draft.rateModel}
              onChange={(event) => update('rateModel')(event.target.value)}
              aria-label="Rate model"
              className={inputClasses}
            >
              <option value="per-stream">Per stream</option>
              <option value="flat-fee">Flat fee</option>
            </select>
          </Field>

          <Field label={draft.rateModel === 'flat-fee' ? 'Agreed fee ($)' : 'Agreed rate ($)'}>
            <input
              value={draft.agreedRate}
              onChange={(event) => update('agreedRate')(event.target.value)}
              inputMode="decimal"
              aria-label="Agreed rate in dollars"
              className={inputClasses}
            />
          </Field>

          <Field label="Streams committed">
            <input
              value={draft.streamsCommitted}
              onChange={(event) => update('streamsCommitted')(event.target.value)}
              inputMode="numeric"
              aria-label="Streams committed"
              className={inputClasses}
            />
          </Field>

          <Field label="Minimum duration (hrs)">
            <input
              value={draft.minimumStreamHours}
              onChange={(event) => update('minimumStreamHours')(event.target.value)}
              inputMode="decimal"
              aria-label="Minimum duration in hours"
              className={inputClasses}
            />
          </Field>

          <Field label="Window opens">
            <input
              type="date"
              value={draft.deliveryWindowStart}
              onChange={(event) => update('deliveryWindowStart')(event.target.value)}
              aria-label="Delivery window opens"
              className={inputClasses}
            />
          </Field>

          <Field label="Window closes">
            <input
              type="date"
              value={draft.deliveryWindowEnd}
              onChange={(event) => update('deliveryWindowEnd')(event.target.value)}
              aria-label="Delivery window closes"
              className={inputClasses}
            />
          </Field>

          <Field label="Additional requirements" className="sm:col-span-2">
            <textarea
              value={draft.requirements}
              onChange={(event) => update('requirements')(event.target.value)}
              rows={2}
              placeholder="Code on screen, link in the description…"
              aria-label="Additional requirements"
              className={joinClassNames(inputClasses, 'resize-y')}
            />
          </Field>

          <p className="text-[12px] text-ink-soft sm:col-span-2">
            Streams are detected from YouTube and Twitch, so delivery is measured against these
            numbers rather than typed in later.
          </p>
        </div>
      )}

      {step === 'payment' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment method">
            <select
              value={draft.paymentMethod}
              onChange={(event) => update('paymentMethod')(event.target.value)}
              aria-label="Payment method"
              className={inputClasses}
            >
              <option value="">—</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </Field>

          <Field label="Payout currency">
            <input
              value={draft.payoutCurrency}
              onChange={(event) => update('payoutCurrency')(event.target.value)}
              aria-label="Payout currency"
              className={inputClasses}
            />
          </Field>

          <Field label="Payment details or reference" className="sm:col-span-2">
            <input
              value={draft.paymentDetails}
              onChange={(event) => update('paymentDetails')(event.target.value)}
              aria-label="Payment details or reference"
              className={joinClassNames(inputClasses, 'font-mono text-[13px]')}
            />
          </Field>

          <p className="text-[12px] text-ink-soft sm:col-span-2">
            Every figure in the tracker is in US dollars. The payout currency is here for whoever
            makes the transfer.
          </p>
        </div>
      )}

      {/* Not a step: these belong to the creator, not to a stage of filling
          the form in, and the team refers to them from any of the three. */}
      <div className="mt-5 border-t border-hair pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tracking link">
            <div className="border border-hair bg-sunk px-3 py-2.5 font-mono text-[13px] text-ink-muted">
              {editing ? (
                getTrackingLink(editing)
              ) : (
                <span className="italic text-ink-faint">Generated on save</span>
              )}
            </div>
          </Field>

          <Field label="Invite status">
            <div className="flex items-center gap-3">
              <span className="border border-hair px-2 py-1 text-[11px] uppercase tracking-[1px] text-ink-muted">
                {editing ? editing.portalInviteState : 'not sent'}
              </span>
              {editing && onSendInvite && (
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
              )}
            </div>
            {isEdited && (
              <p className="mt-1.5 text-[12px] text-ink-muted">
                The invite goes to the email as it now reads, once these changes are saved.
              </p>
            )}
          </Field>

          <Field label="Notes · team only, never shown to the creator" className="sm:col-span-2">
            <textarea
              value={draft.notes}
              onChange={(event) => update('notes')(event.target.value)}
              rows={2}
              aria-label="Notes"
              className={joinClassNames(inputClasses, 'resize-y')}
            />
          </Field>
        </div>
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

const inputClasses = 'w-full border border-hair bg-sunk px-3 py-2.5 text-[14px] text-ink'

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5">{label}</Label>
      {children}
    </div>
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
        'inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center text-[11px] font-bold',
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
