export type ValueOfficeTopNavKey =
  | 'portfolio'
  | 'new'
  | 'reviews'
  | 'execution'
  | 'knowledge'

export type ValueOfficeUseCaseTabKey =
  | 'overview'
  | 'value'
  | 'evidence'
  | 'outcomes'
  | 'review'
  | 'history'

export const VALUE_OFFICE_TOP_LEVEL_NAV: Array<{
  key: ValueOfficeTopNavKey
  label: string
  href: string
  description: string
}> = [
  {
    key: 'portfolio',
    label: 'Portfolio',
    href: '/value-office/portfolio',
    description: 'Track use case status, confidence, and sponsorship.',
  },
  {
    key: 'new',
    label: 'New Use Case',
    href: '/value-office/new',
    description: 'Start with an AI idea and pressure-test it quickly.',
  },
  {
    key: 'reviews',
    label: 'Reviews',
    href: '/value-office/reviews',
    description: 'Prepare decision-ready use cases for executive review.',
  },
  {
    key: 'execution',
    label: 'Execution',
    href: '/value-office/execution',
    description: 'Follow active initiatives, evidence progress, and outcomes.',
  },
  {
    key: 'knowledge',
    label: 'Knowledge',
    href: '/value-office/knowledge',
    description: 'Understand the knowledge layer behind recommendations.',
  },
]

export const VALUE_OFFICE_USE_CASE_TABS: Array<{
  key: ValueOfficeUseCaseTabKey
  label: string
  segment: string
  description: string
}> = [
  {
    key: 'overview',
    label: 'Overview',
    segment: 'overview',
    description: 'Summarize the use case, readiness, and recommendation state.',
  },
  {
    key: 'value',
    label: 'Value Contract',
    segment: 'value',
    description: 'Define the measurable value contract.',
  },
  {
    key: 'evidence',
    label: 'Evidence',
    segment: 'evidence',
    description: 'Define how the product will prove value.',
  },
  {
    key: 'outcomes',
    label: 'Outcomes',
    segment: 'outcomes',
    description: 'Track baseline, target, and observed metrics.',
  },
  {
    key: 'review',
    label: 'Review',
    segment: 'review',
    description: 'Support decision-making with a clean executive view.',
  },
  {
    key: 'history',
    label: 'History',
    segment: 'history',
    description: 'Review advisor conversation and prior decisions.',
  },
]

export function valueOfficeTabHref(useCaseId: string, segment: string) {
  return `/value-office/${useCaseId}/${segment}`
}
