export const CATEGORY_COLORS: Record<string, string> = {
  ראיונות: 'oklch(0.585 0.212 264.4)',
  GitHub: 'oklch(0.65 0.15 211)',
  LinkedIn: 'oklch(0.60 0.17 162)',
  קריירה: 'oklch(0.75 0.16 60)',
  פורטפוליו: 'oklch(0.58 0.21 291)',
  'קורות חיים': 'oklch(0.62 0.22 27)',
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? 'oklch(0.585 0.212 264.4)'
}
