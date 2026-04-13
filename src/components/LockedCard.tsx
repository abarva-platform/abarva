'use client'
import { canViewCategory, getLockedReason, CATEGORY_LABELS } from '@/lib/data-access'
import type { RoleKey, DataCategory } from '@/lib/data-access'

interface LockedCardProps {
  role: RoleKey
  category: DataCategory
  children: React.ReactNode
  /** Optional override: always show locked */
  forceLocked?: boolean
}

/**
 * Wraps any data card. If the current role cannot view this category:
 * - Shows the card outline with a lock overlay
 * - Never hides that data exists — shows it's restricted
 * - Shows "Requires [Role] access. Request access →"
 */
export default function LockedCard({ role, category, children, forceLocked }: LockedCardProps) {
  const isLocked = forceLocked || !canViewCategory(role, category)

  if (!isLocked) return <>{children}</>

  const reason = getLockedReason(role, category)
  const label = CATEGORY_LABELS[category] ?? category

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px' }}>
      {/* Blurred/dimmed children */}
      <div style={{ filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.35 }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(13, 17, 23, 0.75)',
        backdropFilter: 'blur(1px)',
        borderRadius: '10px',
        border: '1px solid #30363D',
        padding: '16px',
        textAlign: 'center',
        gap: '8px',
      }}>
        <div style={{ fontSize: '20px', opacity: 0.7 }}>🔒</div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#C9D1D9' }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#8B949E', maxWidth: '180px', lineHeight: 1.4 }}>
          {reason}. {category} data is available but restricted to authorised roles.
        </div>
        <button style={{
          marginTop: '4px',
          padding: '5px 12px',
          background: 'none',
          border: '1px solid #30363D',
          borderRadius: '6px',
          color: '#4DA3FF',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          Request access →
        </button>
      </div>
    </div>
  )
}
