import { useState, type ReactNode } from 'react'
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
import {
  Button,
  emphasisedFieldInputClasses,
  fieldInputClasses,
  FormField,
  LabelNote,
  Modal,
  monoFieldInputClasses,
} from '@/ui'

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

      {step === 'identity' && (
        /* Two columns from md up. On a phone one, except platform and
           language, which the phone design pairs on a row; the order classes
           move language up beside platform there. */
        <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 md:gap-x-4.5 md:gap-y-3.75">
          <FormField label="Creator name" className="order-1 col-span-2 md:order-0 md:col-span-1">
            <input
              value={draft.name}
              onChange={(event) => update('name')(event.target.value)}
              aria-label="Creator name"
              className={fieldInputClasses}
            />
          </FormField>

          <FormField
            label={
              <>
                Email<LabelNote tone="accent">required</LabelNote>
              </>
            }
            className="order-2 col-span-2 md:order-0 md:col-span-1"
          >
            <input
              type="email"
              value={draft.email}
              onChange={(event) => update('email')(event.target.value)}
              placeholder="invite is sent here"
              aria-label="Email"
              className={fieldInputClasses}
            />
          </FormField>

          <FormField label="Platform" className="order-3 md:order-0">
            <select
              value={draft.platform}
              onChange={(event) => update('platform')(event.target.value)}
              aria-label="Platform"
              className={fieldInputClasses}
            >
              <option value="YouTube">YouTube</option>
              <option value="Twitch">Twitch</option>
            </select>
          </FormField>

          <FormField
            label="Channel URL or ID"
            className="order-5 col-span-2 md:order-0 md:col-span-1"
          >
            <input
              value={draft.channelUrl}
              onChange={(event) => update('channelUrl')(event.target.value)}
              aria-label="Channel URL or ID"
              className={fieldInputClasses}
            />
          </FormField>

          <FormField
            label={<PhoneText wide="Preferred contact handle" phone="Contact handle" />}
            className="order-6 col-span-2 md:order-0 md:col-span-1"
          >
            <input
              value={draft.contactHandle}
              onChange={(event) => update('contactHandle')(event.target.value)}
              placeholder="Telegram or Discord"
              aria-label="Preferred contact handle"
              className={fieldInputClasses}
            />
          </FormField>

          <FormField
            label={<PhoneText wide="Content language" phone="Language" />}
            className="order-4 md:order-0"
          >
            <select
              value={draft.contentLanguage}
              onChange={(event) => update('contentLanguage')(event.target.value)}
              aria-label="Content language"
              className={fieldInputClasses}
            >
              <option value="">—</option>
              {LANGUAGES.map((language) => (
                <option key={language}>{language}</option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Country or region"
            className="order-7 col-span-2 md:order-0 md:col-span-1"
          >
            <select
              value={draft.region}
              onChange={(event) => update('region')(event.target.value)}
              aria-label="Country or region"
              className={fieldInputClasses}
            >
              <option value="">—</option>
              {REGIONS.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </FormField>

          {/* Not in the design's field list, but the creator screen shows it
              beside the channel, so it has to be entered somewhere. */}
          <FormField label="Audience size" className="order-8 col-span-2 md:order-0 md:col-span-1">
            <input
              value={draft.audienceSize}
              onChange={(event) => update('audienceSize')(event.target.value)}
              placeholder="e.g. 412K"
              aria-label="Audience size"
              className={fieldInputClasses}
            />
          </FormField>
        </div>
      )}

      {step === 'deal' && (
        /* Three columns from md up, as the design lays the deal out. On a
           phone a six-track grid: whole rows, halves, and the design's row of
           three for rate, currency and streams. */
        <>
          <div className="grid grid-cols-6 gap-x-3 gap-y-3.5 md:grid-cols-3 md:gap-x-4.5 md:gap-y-3.75">
            <FormField label="Campaign" className="col-span-6 md:col-span-2">
              <select
                value={draft.campaignId}
                onChange={(event) => update('campaignId')(event.target.value)}
                aria-label="Campaign"
                className={fieldInputClasses}
              >
                <option value="">—</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={String(campaign.id)}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assigned code" className="col-span-3 md:col-span-1">
              <input
                value={draft.creatorCode}
                onChange={(event) => update('creatorCode')(event.target.value.toUpperCase())}
                aria-label="Assigned code"
                className={joinClassNames(emphasisedFieldInputClasses, 'tracking-[2px]')}
              />
            </FormField>

            <FormField label="Rate model" className="col-span-3 md:col-span-1">
              <select
                value={draft.rateModel}
                onChange={(event) => update('rateModel')(event.target.value)}
                aria-label="Rate model"
                className={fieldInputClasses}
              >
                <option value="per-stream">Per stream</option>
                <option value="flat-fee">Flat fee</option>
              </select>
            </FormField>

            <FormField
              label={
                <PhoneText
                  wide={draft.rateModel === 'flat-fee' ? 'Agreed fee' : 'Agreed rate'}
                  phone={draft.rateModel === 'flat-fee' ? 'Fee' : 'Rate'}
                />
              }
              className="col-span-2 md:col-span-1"
            >
              <input
                value={draft.agreedRate}
                onChange={(event) => update('agreedRate')(event.target.value)}
                inputMode="decimal"
                aria-label="Agreed rate in dollars"
                className={fieldInputClasses}
              />
            </FormField>

            <FormField
              label={<PhoneText wide="Currency" phone="Cur." />}
              className="col-span-2 md:col-span-1"
            >
              <select
                value={draft.payoutCurrency}
                onChange={(event) => update('payoutCurrency')(event.target.value)}
                aria-label="Payout currency"
                className={fieldInputClasses}
              >
                {currencies.map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label={<PhoneText wide="Streams committed" phone="Streams" />}
              className="col-span-2 md:col-span-1"
            >
              <input
                value={draft.streamsCommitted}
                onChange={(event) => update('streamsCommitted')(event.target.value)}
                inputMode="numeric"
                aria-label="Streams committed"
                className={fieldInputClasses}
              />
            </FormField>

            <FormField label="Min duration (hrs)" className="col-span-6 md:col-span-1">
              <input
                value={draft.minimumStreamHours}
                onChange={(event) => update('minimumStreamHours')(event.target.value)}
                inputMode="decimal"
                aria-label="Minimum duration in hours"
                className={fieldInputClasses}
              />
            </FormField>

            <FormField label="Window opens" className="col-span-3 md:col-span-1">
              <input
                type="date"
                value={draft.deliveryWindowStart}
                onChange={(event) => update('deliveryWindowStart')(event.target.value)}
                aria-label="Delivery window opens"
                className={fieldInputClasses}
              />
            </FormField>

            <FormField label="Window closes" className="col-span-3 md:col-span-1">
              <input
                type="date"
                value={draft.deliveryWindowEnd}
                onChange={(event) => update('deliveryWindowEnd')(event.target.value)}
                aria-label="Delivery window closes"
                className={fieldInputClasses}
              />
            </FormField>

            <FormField label="Additional requirements" className="col-span-6 md:col-span-3">
              <textarea
                value={draft.requirements}
                onChange={(event) => update('requirements')(event.target.value)}
                rows={2}
                placeholder="Code on screen, link in description…"
                aria-label="Additional requirements"
                className={joinClassNames(fieldInputClasses, 'resize-y')}
              />
            </FormField>
          </div>

          <p className="mt-3 hidden text-[12px] text-ink-soft md:block">
            Streams are auto-detected from the YouTube and Twitch APIs, so delivery is measured
            against these numbers.
          </p>
        </>
      )}

      {step === 'payment' && (
        <div className="grid gap-3.5 md:grid-cols-[1fr_1.4fr] md:gap-x-4.5 md:gap-y-3.75">
          <FormField label="Payment method">
            <select
              value={draft.paymentMethod}
              onChange={(event) => update('paymentMethod')(event.target.value)}
              aria-label="Payment method"
              className={fieldInputClasses}
            >
              <option value="">—</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Payment details or reference">
            <input
              value={draft.paymentDetails}
              onChange={(event) => update('paymentDetails')(event.target.value)}
              aria-label="Payment details or reference"
              className={monoFieldInputClasses}
            />
          </FormField>
        </div>
      )}

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

/** Text the phone design words more briefly. Only one of the two is displayed. */
function PhoneText({ wide, phone }: { wide: string; phone: string }): ReactNode {
  return (
    <>
      <span className="md:hidden">{phone}</span>
      <span className="hidden md:inline">{wide}</span>
    </>
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
