'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ValueOfficeUseCaseDetail } from '@/lib/value-office/types'

export function useValueOfficeDetails(ids: string[]) {
  const [items, setItems] = useState<ValueOfficeUseCaseDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const uniqueIds = [...new Set(ids.filter(Boolean))]
      if (!uniqueIds.length) {
        setItems([])
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const results = await Promise.all(uniqueIds.map(async id => {
          const res = await fetch(`/api/value-office/use-cases/${id}`)
          const data = await res.json()
          if (!res.ok || data.error) {
            throw new Error(data.error || `Unable to load use case ${id}`)
          }
          return data.item as ValueOfficeUseCaseDetail | null
        }))

        if (!cancelled) {
          setItems(results.filter(Boolean) as ValueOfficeUseCaseDetail[])
          setError(null)
        }
      } catch (err: any) {
        if (!cancelled) {
          setItems([])
          setError(err.message || 'Unable to load use case detail')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [ids.join('|')])

  const itemMap = useMemo(
    () => Object.fromEntries(items.map(item => [item.id, item])),
    [items],
  )

  return {
    items,
    itemMap,
    loading,
    error,
  }
}
