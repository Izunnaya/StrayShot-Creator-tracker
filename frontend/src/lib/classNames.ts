/**
 * Joins CSS class names together, dropping anything falsy so that conditional
 * classes can be written inline:
 *
 *   joinClassNames('border', isSelected && 'border-amber')
 */
export function joinClassNames(
  ...classNames: (string | false | null | undefined)[]
): string {
  return classNames.filter(Boolean).join(' ')
}
