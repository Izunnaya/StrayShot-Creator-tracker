// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from '@/App'

/**
 * Adding and editing a creator, driven through the rendered application.
 *
 * The behaviour worth proving is the one the three steps exist for: a record
 * saved from step one alone is real and shows up as a prospect, and the deal
 * can be finished later without re-entering anything.
 */

afterEach(cleanup)

const dialog = () => within(screen.getByRole('dialog'))
const creatorTable = () => within(screen.getByRole('table', { name: 'Creator performance' }))

async function openTheAddForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '+ Add creator' }))
}

async function fillIdentity(user: ReturnType<typeof userEvent.setup>) {
  await user.type(dialog().getByLabelText('Creator name'), 'AshFall')
  await user.type(dialog().getByLabelText('Email'), 'ash@creators.gg')
}

describe('adding a creator', () => {
  it('saves from step one alone, as a prospect', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheAddForm(user)

    // The button says what saving now would produce.
    expect(dialog().getByRole('button', { name: 'Save as prospect' })).toBeTruthy()

    await fillIdentity(user)
    await user.click(dialog().getByRole('button', { name: 'Save as prospect' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(creatorTable().getByRole('button', { name: 'AshFall' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Prospect/ }).textContent).toMatch(/1/)
  })

  it('records the invite as sent when it is saved and sent in one step', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheAddForm(user)

    await fillIdentity(user)
    await user.click(dialog().getByRole('button', { name: 'Save and send invite' }))

    expect(screen.queryByRole('dialog')).toBeNull()

    // Reopening the record is the only place the invite state is shown.
    await user.click(creatorTable().getByRole('button', { name: 'AshFall' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(dialog().getByText('sent')).toBeTruthy()
    expect(dialog().getByRole('button', { name: 'Resend' })).toBeTruthy()
  })

  it('refuses to save and send without an email, since that is where the invite goes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheAddForm(user)

    await user.type(dialog().getByLabelText('Creator name'), 'AshFall')
    await user.click(dialog().getByRole('button', { name: 'Save and send invite' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(dialog().getByRole('alert').textContent).toMatch(/invite is sent there/)
    expect(creatorTable().queryByRole('button', { name: 'AshFall' })).toBeNull()
  })

  it('refuses to save without an email, since that is where the invite goes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheAddForm(user)

    await user.type(dialog().getByLabelText('Creator name'), 'AshFall')
    await user.click(dialog().getByRole('button', { name: 'Save as prospect' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(dialog().getByRole('alert').textContent).toMatch(/invite is sent there/)
  })

  it('offers to save a full deal as a creator rather than a prospect', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheAddForm(user)
    await fillIdentity(user)

    await user.click(dialog().getByRole('button', { name: 'Step 2: The deal, incomplete' }))
    await user.selectOptions(dialog().getByLabelText('Campaign'), '1')
    await user.type(dialog().getByLabelText('Assigned code'), 'ASH')
    await user.type(dialog().getByLabelText('Agreed rate in dollars'), '1800')
    await user.type(dialog().getByLabelText('Streams committed'), '2')

    expect(dialog().getByRole('button', { name: 'Step 2: The deal, complete' })).toBeTruthy()
    expect(dialog().getByRole('button', { name: 'Save creator' })).toBeTruthy()

    await user.click(dialog().getByRole('button', { name: 'Save creator' }))

    const row = creatorTable().getByRole('button', { name: 'AshFall' }).closest('tr')!
    expect(within(row).getByText('$0 / $3,600')).toBeTruthy()
    expect(within(row).getByText('contracted')).toBeTruthy()
  })

  it('refuses a code another creator already has', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheAddForm(user)
    await fillIdentity(user)

    await user.click(dialog().getByRole('button', { name: /^Step 2: The deal, / }))
    await user.selectOptions(dialog().getByLabelText('Campaign'), '1')
    await user.type(dialog().getByLabelText('Assigned code'), 'NOVA')
    await user.type(dialog().getByLabelText('Agreed rate in dollars'), '1800')
    await user.type(dialog().getByLabelText('Streams committed'), '2')
    await user.click(dialog().getByRole('button', { name: 'Save creator' }))

    expect(dialog().getByRole('alert').textContent).toMatch(/already has that code/)
  })

  it('treats a deal someone started but did not finish as unfinished', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheAddForm(user)
    await fillIdentity(user)

    await user.click(dialog().getByRole('button', { name: /^Step 2: The deal, / }))
    await user.type(dialog().getByLabelText('Assigned code'), 'ASH')

    // Touching the deal changes what saving means, so the button says so.
    await user.click(dialog().getByRole('button', { name: 'Save creator' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(dialog().getByRole('alert').textContent).toMatch(/Choose the campaign/)
  })

  it('says the tracking link does not exist until the record does', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTheAddForm(user)

    expect(dialog().getByText('Generated on save')).toBeTruthy()
  })
})

describe('editing a creator', () => {
  async function openNovaKessForEditing(user: ReturnType<typeof userEvent.setup>) {
    await user.click(creatorTable().getByRole('button', { name: 'NovaKess' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))
  }

  it('opens prefilled with what was already agreed', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openNovaKessForEditing(user)

    expect((dialog().getByLabelText('Creator name') as HTMLInputElement).value).toBe('NovaKess')

    await user.click(dialog().getByRole('button', { name: /^Step 2: The deal, / }))
    expect((dialog().getByLabelText('Assigned code') as HTMLInputElement).value).toBe('NOVA')
    expect((dialog().getByLabelText('Agreed rate in dollars') as HTMLInputElement).value).toBe(
      '1600',
    )
  })

  it('shows the tracking link once the creator exists', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openNovaKessForEditing(user)

    expect(dialog().getByText('strayshot.game/r/nova')).toBeTruthy()
  })

  it('leaves what was measured alone when the deal is edited', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openNovaKessForEditing(user)

    await user.click(dialog().getByRole('button', { name: /^Step 2: The deal, / }))
    const rate = dialog().getByLabelText('Agreed rate in dollars')
    await user.clear(rate)
    await user.type(rate, '2000')
    await user.click(dialog().getByRole('button', { name: 'Save changes' }))

    // 3 streams at the new rate is $6,000 agreed; the 4,210 installs and the
    // $3,200 already paid are untouched.
    expect(screen.getByText(/\$3,200 of \$6,000 paid/)).toBeTruthy()
    expect(screen.getByText('4,210')).toBeTruthy()
  })

  it('shows the invite state a creator already has', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(creatorTable().getByRole('button', { name: 'QuietStorm' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(dialog().getByText('claimed')).toBeTruthy()
  })

  it('updates the form itself when an invite is sent from inside it', async () => {
    const user = userEvent.setup()
    render(<App />)

    // A creator added here starts with no invite sent, unlike the fixtures.
    await user.click(screen.getByRole('button', { name: '+ Add creator' }))
    await fillIdentity(user)
    await user.click(dialog().getByRole('button', { name: 'Save as prospect' }))

    await user.click(creatorTable().getByRole('button', { name: 'AshFall' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(dialog().getByText('not sent')).toBeTruthy()

    await user.click(dialog().getByRole('button', { name: 'Send invite' }))

    // The form is looking at the list, not at a copy taken when it opened.
    expect(dialog().getByText('sent')).toBeTruthy()
    expect(dialog().getByRole('button', { name: 'Resend' })).toBeTruthy()
    expect(dialog().queryByRole('button', { name: 'Send invite' })).toBeNull()
  })
})

describe('sending the invite from a form that has been edited', () => {
  /* The address is the one thing an invite depends on, and correcting it is
     the reason anyone opens this field. Sending from the record as it stands
     would send to the address being corrected. */

  async function openAshFallWithNoInviteSent(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: '+ Add creator' }))
    await fillIdentity(user)
    await user.click(dialog().getByRole('button', { name: 'Save as prospect' }))
    await user.click(creatorTable().getByRole('button', { name: 'AshFall' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))
  }

  it('says it will save first, once anything has been edited', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAshFallWithNoInviteSent(user)

    expect(dialog().getByRole('button', { name: 'Send invite' })).toBeTruthy()

    await user.clear(dialog().getByLabelText('Email'))
    await user.type(dialog().getByLabelText('Email'), 'ash@newhouse.gg')

    expect(dialog().getByRole('button', { name: 'Save and send invite' })).toBeTruthy()
    expect(dialog().queryByRole('button', { name: 'Send invite' })).toBeNull()
  })

  it('keeps the corrected address rather than sending to the old one', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAshFallWithNoInviteSent(user)

    await user.clear(dialog().getByLabelText('Email'))
    await user.type(dialog().getByLabelText('Email'), 'ash@newhouse.gg')
    await user.click(dialog().getByRole('button', { name: 'Save and send invite' }))

    // Reopened from the list, so this is the record, not the form's memory.
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect((dialog().getByLabelText('Email') as HTMLInputElement).value).toBe('ash@newhouse.gg')
    expect(dialog().getByText('sent')).toBeTruthy()
  })

  it('refuses to send while the form cannot be saved', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openAshFallWithNoInviteSent(user)

    await user.clear(dialog().getByLabelText('Email'))
    await user.click(dialog().getByRole('button', { name: 'Save and send invite' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(dialog().getByRole('alert').textContent).toMatch(/invite is sent there/)
    expect(dialog().getByText('not sent')).toBeTruthy()
  })

  it('does not knock a claimed invite back to sent', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(creatorTable().getByRole('button', { name: 'QuietStorm' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(dialog().getByLabelText('Email'))
    await user.type(dialog().getByLabelText('Email'), 'quiet@newhouse.gg')
    await user.click(dialog().getByRole('button', { name: 'Save and resend' }))

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(dialog().getByText('claimed')).toBeTruthy()
  })
})
