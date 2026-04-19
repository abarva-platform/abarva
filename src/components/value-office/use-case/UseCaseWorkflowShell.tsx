'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { VALUE_OFFICE_USE_CASE_TABS, valueOfficeTabHref } from '@/lib/value-office/navigation'
import { VALUE_OFFICE_COLORS, valueOfficeBannerStyle, titleCase } from '../design'
import { UseCaseWorkspaceProvider, useUseCaseWorkspace, type SuccessScope } from './UseCaseWorkspaceProvider'

const { pageBg: BG, panel: PANEL, ink: INK, muted: MUTED, line: LINE, teal: TEAL, red: RED, shell: SHELL } = VALUE_OFFICE_COLORS

function UseCaseWorkflowFrame({ useCaseId, children }: { useCaseId: string; children: ReactNode }) {
  const pathname = usePathname()
  const {
    item,
    loading,
    schemaReady,
    error,
    decisionEngine,
    contradictions,
    sourceHealthSummary,
    outcomeSummary,
    workflow,
    nextActions,
  } = useUseCaseWorkspace()

  const currentIndex = VALUE_OFFICE_USE_CASE_TABS.findIndex(tab => pathname.endsWith(`/${tab.segment}`))
  const currentTab = VALUE_OFFICE_USE_CASE_TABS[currentIndex >= 0 ? currentIndex : 0]
  const nextTab = currentIndex >= 0 && currentIndex < VALUE_OFFICE_USE_CASE_TABS.length - 1
    ? VALUE_OFFICE_USE_CASE_TABS[currentIndex + 1]
    : null

  const nextMove = !item
    ? 'Load the use case to continue the workflow.'
    : nextActions[0]?.description || 'Continue the workflow.'

  return (
    <div style={{ background: BG, color: INK, minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ maxWidth: 1520, margin: '0 auto', padding: '0 24px 42px' }}>
        <section style={{ background: SHELL, border: `1px solid ${LINE}`, borderRadius: 24, padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, alignItems: 'start' }}>
            <div>
              <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 8 }}>
                Use Case Workflow
              </div>
              <div style={{ fontSize: 30, lineHeight: 1.1, marginBottom: 6 }}>
                {loading ? 'Loading use case…' : item?.title || 'Use case workspace'}
              </div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, maxWidth: 900 }}>
                {currentTab.description}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {VALUE_OFFICE_USE_CASE_TABS.map((tab, index) => {
                  const active = tab.key === currentTab.key
                  const completed = index < (currentIndex >= 0 ? currentIndex : 0)
                  return (
                    <div
                      key={tab.key}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 999,
                        border: `1px solid ${active ? 'rgba(18,124,114,0.18)' : LINE}`,
                        background: active ? '#EFFAF7' : completed ? '#FFF9F0' : PANEL,
                        color: active ? TEAL : completed ? INK : MUTED,
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: active || completed ? 700 : 500,
                        fontSize: 12,
                      }}
                    >
                      {index + 1}. {tab.label}
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, background: PANEL }}>
              {item ? (
                <>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ padding: '8px 10px', borderRadius: 999, background: '#FFF9F0', border: `1px solid ${LINE}`, fontFamily: 'Courier New, monospace', fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {titleCase(item.status)}
                    </span>
                    <span style={{ padding: '8px 10px', borderRadius: 999, background: '#EFFAF7', color: TEAL, fontFamily: 'Courier New, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Confidence {item.confidence_score}/100
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 8 }}>
                    Current stage
                  </div>
                  <div style={{ fontSize: 24, lineHeight: 1.1, marginBottom: 4 }}>{workflow.current_stage}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.55, marginBottom: 12 }}>
                    {workflow.stage_progress}% complete · {workflow.missing_requirements.length} missing requirement{workflow.missing_requirements.length === 1 ? '' : 's'}
                  </div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEAL, marginBottom: 8 }}>
                    Recommended next move
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>
                    {nextMove}
                  </div>
                  {nextTab && (
                    <Link
                      href={valueOfficeTabHref(useCaseId, nextTab.segment)}
                      style={{
                        display: 'inline-block',
                        textDecoration: 'none',
                        padding: '10px 12px',
                        borderRadius: 14,
                        background: '#171411',
                        color: '#F7FFFE',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 700,
                      }}
                    >
                      Continue to {nextTab.label}
                    </Link>
                  )}
                </>
              ) : (
                <div style={{ fontFamily: 'DM Sans, sans-serif', color: MUTED, lineHeight: 1.6 }}>
                  Workflow guidance will appear once the use case loads.
                </div>
              )}
            </div>
          </div>
        </section>

        {!schemaReady && (
          <div style={{ ...valueOfficeBannerStyle('#FFF4E5', '#F2C488', '#7A4B08'), marginBottom: 18 }}>
            AI Value Office detail is running in limited mode. Saved workflow data is unavailable until the Value Office Supabase tables are live and reachable.
          </div>
        )}

        {error && (
          <div style={{ ...valueOfficeBannerStyle('#FDEEEE', '#E6B1AA', RED), marginBottom: 18 }}>
            {error}
          </div>
        )}

        <section style={{ display: 'grid', gap: 18 }}>
          {children}
        </section>
      </div>
    </div>
  )
}

export function UseCaseSuccessBanner({ scope, dark = false }: { scope: SuccessScope; dark?: boolean }) {
  const { successState } = useUseCaseWorkspace()
  if (!successState || successState.scope !== scope) return null
  return (
    <div
      style={{
        ...(dark
          ? valueOfficeBannerStyle('rgba(135,213,200,0.14)', 'rgba(135,213,200,0.35)', '#C9F3EB')
          : valueOfficeBannerStyle('#EAF6F3', '#B8D9D2', TEAL)),
        marginBottom: 14,
      }}
    >
      {successState.message}
    </div>
  )
}

export default function UseCaseWorkflowShell({
  useCaseId,
  children,
}: {
  useCaseId: string
  children: ReactNode
}) {
  const pathname = usePathname()

  return (
    <UseCaseWorkspaceProvider useCaseId={useCaseId}>
      <div style={{ position: 'sticky', top: 116, zIndex: 35, background: 'rgba(244,239,230,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1520, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minHeight: 54 }}>
            <Link href="/value-office/portfolio" style={{ textDecoration: 'none', color: MUTED, fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
              Portfolio
            </Link>
            <span style={{ color: MUTED, opacity: 0.45 }}>/</span>
            {VALUE_OFFICE_USE_CASE_TABS.map(tab => {
              const href = valueOfficeTabHref(useCaseId, tab.segment)
              const active = pathname === href
              return (
                <Link
                  key={tab.key}
                  href={href}
                  style={{
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: `1px solid ${active ? 'rgba(18,124,114,0.18)' : LINE}`,
                    background: active ? '#EFFAF7' : SHELL,
                    color: active ? TEAL : MUTED,
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                  }}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <UseCaseWorkflowFrame useCaseId={useCaseId}>{children}</UseCaseWorkflowFrame>
    </UseCaseWorkspaceProvider>
  )
}
