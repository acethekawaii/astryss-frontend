const compactCountFormat = new Intl.NumberFormat('en-US', { notation: 'compact' })
const fullCountFormat = new Intl.NumberFormat('en-US')

/** 999 → "999", 1,234 → "1.2K", 5,100,000 → "5.1M". */
export function formatCompactCount(count: number): string {
  return compactCountFormat.format(count)
}

/** 1234 → "1,234". */
export function formatFullCount(count: number): string {
  return fullCountFormat.format(count)
}
