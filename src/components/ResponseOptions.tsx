'use client'
import { useState } from 'react'

export interface ResponseOption {
  icon: string
  title: string
  description: string
  promptText: string
}

interface ResponseOptionsProps {
  options: ResponseOption[]
  onSelect: (promptText: string) => void
  disabled?: boolean
}

export default function ResponseOptions({ options, onSelect, disabled = false }: ResponseOptionsProps) {
  const [freeText, setFreeText] = useState('')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  function handleSend() {
    const text = freeText.trim()
    if (!text) return
    onSelect(text)
    setFreeText('')
  }

  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
        Follow up
      </div>

      {/* Option cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {options.slice(0, 3).map((opt, i) => (
          <button
            key={i}
            onClick={() => !disabled && onSelect(opt.promptText)}
            disabled={disabled}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              minHeight: '52px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: hoveredIdx === i ? '1.5px solid #2DD4C8' : '1px solid #E2E8F0',
              background: hoveredIdx === i ? '#F0FFFE' : '#FFFFFF',
              textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'border-color 150ms, background 150ms',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px', lineHeight: 1 }}>{opt.icon}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{opt.title}</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.4 }}>{opt.description}</span>
          </button>
        ))}
      </div>

      {/* Free text input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Ask your own follow-up..."
          disabled={disabled}
          style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            border: '1px solid #E2E8F0',
            outline: 'none',
            background: '#FFFFFF',
            color: '#0F172A',
            fontFamily: 'Inter, sans-serif',
            opacity: disabled ? 0.5 : 1,
          }}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#2DD4C8'}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#E2E8F0'}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !freeText.trim()}
          style={{
            padding: '9px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#2563EB',
            color: 'white',
            border: 'none',
            cursor: disabled || !freeText.trim() ? 'not-allowed' : 'pointer',
            opacity: disabled || !freeText.trim() ? 0.4 : 1,
            transition: 'opacity 150ms',
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
