import type { CreatorDraft } from '@/domain/creatorRecording'
import { fieldInputClasses, FormField, LabelNote } from '@/ui'
import { PhoneText } from './PhoneText'

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

/**
 * Step one: who they are. A name and an email is a creator on its own,
 * which is why this step saves without the two after it.
 */
export function CreatorIdentityStep({
  draft,
  update,
}: {
  draft: CreatorDraft
  update: (field: keyof CreatorDraft) => (value: string) => void
}) {
  return (
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

      <FormField label="Channel URL or ID" className="order-5 col-span-2 md:order-0 md:col-span-1">
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

      <FormField label="Country or region" className="order-7 col-span-2 md:order-0 md:col-span-1">
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
  )
}
