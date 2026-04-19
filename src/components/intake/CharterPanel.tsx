'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// CharterPanel — right-pane charter view for the partner-style intake.
//
// Behavior:
//   1. On mount and whenever `refreshKey` changes, GET /api/intake/charter.
//   2. If GET returns null charter AND the intake has advanced past the
//      minimum threshold (refresh count > 0), POST /api/intake/charter to
//      draft. POST returns 400 if too few turns — panel keeps placeholder.
//   3. When charter.status === 'pending_approval', render all 12 fields +
//      two action buttons: "Push back on something" and "Looks right".
//   4. On 'approved', render the success state.
//
// Props note: `refreshKey` and `onPushback` are not in the original Package
// 2A spec's prop list but are needed to wire the panel to the IntakeConversation
// lifecycle without a global store. Keep both optional.
// ─────────────────────────────────────────────────────────────────────────────

type Charter = {
  id: string
  engagement_id: string
  client_id: string
  created_by_user_id: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  problem: string | null
  desired_outcome: string | null
  timeline: string | null
  success_metrics: string | null
  primary_sponsor: string | null
  co_sponsor: string | null
  workstreams: string[] | null
  dependencies: string | null
  data_available: string[] | null
  data_gaps: string[] | null
  risks: string[] | null
  approval_required_from: string[] | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
}

export type CharterPanelProps = {
  engagementId: string
  clientId: string
  userId: string
  refreshKey?: number
  clientName?: string
  userRole?: string
  onPushback?: (feedback: string) => void
}

const COLOR = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceAlt: '#161616',
  border: '#222222',
  borderSoft: '#1B1B1B',
  ink: '#EDEDED',
  muted: '#8A8A8A',
  mutedSoft: '#5B5B5B',
  teal: '#2DD4C8',
  tealSoft: '#0F3C3A',
  warn: '#F59E0B',
}

const FONT_BODY = 'DM Sans, system-ui, sans-serif'
const FONT_MONO = 'JetBrains Mono, ui-monospace, monospace'

const FIELD_ORDER: Array<{
  key: keyof Charter
  label: string
  kind: 'text' | 'list'
}> = [
  { key: 'problem', label: 'Problem', kind: 'text' },
  { key: 'desired_outcome', label: 'Desired outcome', kind: 'text' },
  { key: 'timeline', label: 'Timeline', kind: 'text' },
  { key: 'success_metrics', label: 'Success metrics', kind: 'text' },
  { key: 'primary_sponsor', label: 'Primary sponsor', kind: 'text' },
  { key: 'co_sponsor', label: 'Co-sponsor', kind: 'text' },
  { key: 'workstreams', label: 'Workstreams (proposed)', kind: 'list' },
  { key: 'dependencies', label: 'Dependencies', kind: 'text' },
  { key: 'data_available', label: 'Data we already have', kind: 'list' },
  { key: 'data_gaps', label: 'Data gaps', kind: 'list' },
  { key: 'risks', label: 'Risks named upfront', kind: 'list' },
  { key: 'approval_required_from', label: 'Approval required from', kind: 'list' },
]

export default function CharterPanel({
  engagementId,
  clientId,
  userId,
  refreshKey = 0,
  clientName,
  userRole,
  onPushback,
}: CharterPanelProps) {
  const [charter, setCharter] = useState<Charter | null>(null)
  const [loading, setLoading] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pushbackOpen, setPushbackOpen] = useState(false)
  const [pushbackText, setPushbackText] = useState('')
  const [approving, setApproving] = useState(false)
  const draftAttemptedRef = useRef(0)

  const ready = Boolean(engagementId && clientId && userId)

  const fetchCharter = useCallback(async () => {
    if (!ready) return null
    const res = await fetch(
      `/api/intake/charter?engagement_id=${encodeURIComponent(engagementId)}`,
    )
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`charter fetch failed: ${res.status}`)
    }
    const data = (await res.json()) as { charter?: Charter | null }
    return data.charter ?? null
  }, [engagementId, ready])

  const draftCharter = useCallback(async () => {
    if (!ready) return null
    const res = await fetch('/api/intake/charter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engagement_id: engagementId,
        client_id: clientId,
        user_id: userId,
      }),
    })
    if (!res.ok) {
      if (res.status === 400) return null // not advanced enough yet
      const body = await res.text().catch(() => '')
      throw new Error(`charter draft failed: ${res.status} ${body}`)
    }
    const data = (await res.json()) as { charter?: Charter | null }
    return data.charter ?? null
  }, [engagementId, clientId, userId, ready])

  useEffect(() => {
    if (!ready) return
    let cancelled = false

    async function sync() {
      setLoading(true)
      setError(null)
      try {
        const existing = await fetchCharter()
        if (cancelled) return
        if (existing) {
          setCharter(existing)
          return
        }
        // No charter yet — try a draft only after intake signals readiness.
        if (refreshKey > 0 && !drafting) {
          draftAttemptedRef.current += 1
          setDrafting(true)
          const drafted = await draftCharter()
          if (cancelled) return
          setDrafting(false)
          if (drafted) setCharter(drafted)
        }
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'unknown error'
        setError(msg)
        setDrafting(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void sync()
    return () => {
      cancelled = true
    }
    // drafting intentionally omitted to avoid re-trigger loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, refreshKey, fetchCharter, draftCharter])

  async function handlePushback() {
    const text = pushbackText.trim()
    if (!text) return
    setPushbackOpen(false)
    setPushbackText('')

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagement_id: engagementId,
          client_id: clientId,
          user_id: userId,
          clientName,
          userRole,
          message: text,
        }),
      })
      // Drain stream so the server finishes persistence before we refresh.
      if (res.body) {
        const reader = res.body.getReader()
        while (true) {
          const { done } = await reader.read()
          if (done) break
        }
      }
    } catch (err) {
      console.warn('[charter] pushback POST failed:', err)
    }

    onPushback?.(text)
  }

  async function handleApprove() {
    if (!charter) return
    setApproving(true)
    setError(null)
    try {
      const res = await fetch(`/api/intake/charter/${charter.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'approve' }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`${res.status} ${body}`)
      }
      const data = (await res.json()) as { charter?: Charter | null }
      if (data.charter) setCharter(data.charter)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      setError(msg)
    } finally {
      setApproving(false)
    }
  }

  const content = useMemo(() => {
    if (!ready) return null

    if (!charter) {
      const waiting =
        drafting || (refreshKey > 0 && loading)
          ? 'Drafting charter from the intake…'
          : 'Charter will draft here once the intake reaches Act 5.'
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '36px 28px',
            color: COLOR.muted,
            fontSize: 13.5,
            border: `1px dashed ${COLOR.border}`,
            borderRadius: 12,
            margin: 20,
          }}
        >
          {waiting}
        </div>
      )
    }

    const approved = charter.status === 'approved'
    const rejected = charter.status === 'rejected'

    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 24px 10px',
            borderBottom: `1px solid ${COLOR.borderSoft}`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: approved ? COLOR.teal : rejected ? COLOR.warn : COLOR.muted,
              marginBottom: 4,
            }}
          >
            {approved
              ? 'APPROVED'
              : rejected
                ? 'REJECTED'
                : 'PENDING APPROVAL'}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: COLOR.ink }}>
            Engagement charter
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {FIELD_ORDER.map((f) => {
            const raw = charter[f.key] as string | string[] | null | undefined
            return (
              <div key={String(f.key)}>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: COLOR.mutedSoft,
                    marginBottom: 4,
                  }}
                >
                  {f.label}
                </div>
                {f.kind === 'text' ? (
                  <div
                    style={{
                      color: raw ? COLOR.ink : COLOR.mutedSoft,
                      fontSize: 14,
                      lineHeight: 1.55,
                    }}
                  >
                    {typeof raw === 'string' && raw ? raw : '—'}
                  </div>
                ) : (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: COLOR.ink,
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    {Array.isArray(raw) && raw.length > 0 ? (
                      raw.map((item, i) => <li key={i}>{item}</li>)
                    ) : (
                      <li style={{ color: COLOR.mutedSoft, listStyle: 'none' }}>
                        —
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )
          })}
        </div>

        {approved ? (
          <div
            style={{
              padding: '14px 24px',
              borderTop: `1px solid ${COLOR.borderSoft}`,
              background: COLOR.tealSoft,
              color: COLOR.teal,
              fontSize: 13.5,
              fontFamily: FONT_BODY,
            }}
          >
            Charter approved. Phase 1 kickoff queued.
          </div>
        ) : rejected ? (
          <div
            style={{
              padding: '14px 24px',
              borderTop: `1px solid ${COLOR.borderSoft}`,
              color: COLOR.warn,
              fontSize: 13.5,
            }}
          >
            Rejected{charter.rejection_reason ? `: ${charter.rejection_reason}` : '.'}
          </div>
        ) : (
          <div
            style={{
              padding: '14px 22px',
              borderTop: `1px solid ${COLOR.borderSoft}`,
              background: COLOR.surfaceAlt,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {pushbackOpen ? (
              <>
                <textarea
                  value={pushbackText}
                  onChange={(e) => setPushbackText(e.target.value)}
                  placeholder="What should change in the charter?"
                  rows={3}
                  style={{
                    background: COLOR.bg,
                    border: `1px solid ${COLOR.border}`,
                    color: COLOR.ink,
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPushbackOpen(false)
                      setPushbackText('')
                    }}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${COLOR.border}`,
                      color: COLOR.ink,
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontFamily: 'inherit',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePushback}
                    disabled={!pushbackText.trim()}
                    style={{
                      background: COLOR.teal,
                      color: '#06201E',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontFamily: 'inherit',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: pushbackText.trim() ? 'pointer' : 'default',
                      opacity: pushbackText.trim() ? 1 : 0.5,
                    }}
                  >
                    Send pushback
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPushbackOpen(true)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${COLOR.border}`,
                    color: COLOR.ink,
                    borderRadius: 8,
                    padding: '9px 16px',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Push back on something
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={approving}
                  style={{
                    background: COLOR.teal,
                    color: '#06201E',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 16px',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: approving ? 'default' : 'pointer',
                    opacity: approving ? 0.6 : 1,
                  }}
                >
                  {approving ? 'Approving…' : 'Looks right — write it up'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }, [
    ready,
    charter,
    drafting,
    refreshKey,
    loading,
    pushbackOpen,
    pushbackText,
    approving,
  ])

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        color: COLOR.ink,
        fontFamily: FONT_BODY,
      }}
    >
      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: '#2A1515',
            color: '#F87171',
            fontFamily: FONT_MONO,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
      {content}
    </div>
  )
}
