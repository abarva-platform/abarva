'use client';

import type { AtlasSuggestion } from '@/lib/atlas/types';
import { AutosizeTextarea } from '@/components/shared/AutosizeTextarea';

const INK = '#F8FAFC';
const MUTE = '#CBD5E1';
const SOFT = '#94A3B8';
const TEAL = '#14B8A6';
const ATLAS = '#F59E0B';

export interface AtlasMessage {
  id: string;
  role: 'atlas' | 'user';
  content: string;
}

export function AtlasChatPanel({
  messages,
  pending,
  input,
  onInputChange,
  onSubmit,
  suggestions,
  onSuggestion,
}: {
  messages: AtlasMessage[];
  pending: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  suggestions: AtlasSuggestion[];
  onSuggestion: (suggestion: AtlasSuggestion) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: TEAL,
        }}
      >
        Atlas chat
      </div>

      <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              padding: 14,
              borderRadius: 18,
              background:
                message.role === 'atlas'
                  ? 'linear-gradient(180deg, rgba(30,41,59,0.98), rgba(28,34,46,0.98))'
                  : 'rgba(15,23,42,0.48)',
              border:
                message.role === 'atlas'
                  ? '0.5px solid rgba(245,158,11,0.18)'
                  : '0.5px solid rgba(148,163,184,0.14)',
            }}
          >
            <div
              style={{
                marginBottom: 6,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: message.role === 'atlas' ? ATLAS : SOFT,
              }}
            >
              {message.role === 'atlas' ? 'Atlas' : 'You'}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, color: message.role === 'atlas' ? MUTE : INK }}>
              {message.content}
            </div>
          </div>
        ))}
        {pending && <div style={{ fontSize: 12, color: SOFT }}>Responding…</div>}
      </div>

      {suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.kind ?? 'message'}:${suggestion.label}:${suggestion.value}`}
              type="button"
              onClick={() => onSuggestion(suggestion)}
              style={{
                padding: '8px 10px',
                borderRadius: 999,
                border: '0.5px solid rgba(148,163,184,0.18)',
                background: suggestion.kind === 'link' ? 'rgba(20,184,166,0.08)' : 'rgba(15,23,42,0.32)',
                color: INK,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          padding: 10,
          borderRadius: 18,
          border: '0.5px solid rgba(148,163,184,0.18)',
          background: 'rgba(15,23,42,0.42)',
        }}
      >
        <AutosizeTextarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Ask Atlas about portfolio state…"
          minRows={1}
          maxRows={5}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: INK,
            fontSize: 13,
            lineHeight: 1.55,
            minHeight: 44,
            padding: '11px 0',
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          style={{
            padding: '10px 14px',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, rgba(20,184,166,0.96), rgba(37,99,235,0.92))',
            color: '#03121A',
            fontWeight: 800,
            cursor: pending ? 'default' : 'pointer',
            opacity: pending ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
