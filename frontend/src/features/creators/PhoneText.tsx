import type { ReactNode } from 'react'

/** Text the phone design words more briefly. Only one of the two is displayed. */
export function PhoneText({ wide, phone }: { wide: string; phone: string }): ReactNode {
  return (
    <>
      <span className="md:hidden">{phone}</span>
      <span className="hidden md:inline">{wide}</span>
    </>
  )
}
