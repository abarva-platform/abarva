'use client'

import { useEffect, useMemo, useState } from 'react'
import { useClientContext } from '@/lib/use-client-context'
import type { ValueOfficeUseCaseRecord } from '@/lib/value-office/types'

export function useValueOfficeList() {
  const { clientId } = useClientContext()
  const [items, setItems] = useState<ValueOfficeUseCaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [schemaReady, setSchemaReady] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/value-office/use-cases?clientId=${clientId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to load AI Value Office use cases')
      setSchemaReady(data.schemaReady !== false)
      setItems(data.items || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [clientId])

  const grouped = useMemo(() => ({
    review: items.filter(item => ['recommended', 'ready_for_review', 'hold', 'redesign'].includes(item.status)),
    execution: items.filter(item => ['approved', 'pilot', 'scaled'].includes(item.status)),
  }), [items])

  return {
    clientId,
    items,
    grouped,
    loading,
    schemaReady,
    error,
    reload: load,
  }
}
