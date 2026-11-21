export function compareOptionalDatesDescending(a: string | null, b: string | null) {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return b.localeCompare(a)
}
