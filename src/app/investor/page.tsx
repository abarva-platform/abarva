import { redirect } from 'next/navigation'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function toQueryString(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      query.set(key, value)
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item)
      }
    }
  }

  const encoded = query.toString()
  return encoded ? `?${encoded}` : ''
}

export default async function InvestorRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  redirect(`/investors${toQueryString(params)}`)
}
