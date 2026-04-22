'use client';

import { useRef, useState } from 'react';
import { UploadChip } from './UploadChip';
import type { UploadedAttachment } from '@/hooks/useNexusStream';

export function AskIntelligenceBar({
  suggestedQueries,
  onSubmit,
  onSuggestedTap,
  onFileSelected,
  attachments,
  disabled,
}: {
  suggestedQueries: string[];
  onSubmit: (query: string) => void;
  onSuggestedTap: (query: string) => void;
  onFileSelected: (file: File) => void;
  attachments: UploadedAttachment[];
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="intel-card intel-section">
      <div className="intel-eyebrow">Zone 2 · Ask Intelligence</div>
      <div className="intel-askbar" style={{ marginTop: 12 }}>
        <textarea
          className="intel-askbar-input"
          placeholder="What are health systems like us doing on ambient documentation?"
          value={query}
          disabled={disabled}
          spellCheck
          autoCorrect="on"
          autoCapitalize="sentences"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!disabled && query.trim()) {
                onSubmit(query.trim());
                setQuery('');
              }
            }
          }}
        />
        {attachments.length > 0 ? (
          <div className="intel-inline-list" style={{ marginTop: 10 }}>
            {attachments.map((attachment) => (
              <UploadChip key={attachment.fileId} attachment={attachment} />
            ))}
          </div>
        ) : null}
        <div className="intel-row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
          <div className="intel-row">
            <button type="button" className="intel-button-outline" onClick={() => fileRef.current?.click()} disabled={disabled}>
              Attach file
            </button>
            <span className="intel-subtle" style={{ fontSize: 12 }}>
              Files stage ephemerally today; extraction wiring is follow-up.
            </span>
          </div>
          <button
            type="button"
            className="intel-button"
            disabled={disabled || !query.trim()}
            onClick={() => {
              if (!query.trim()) return;
              onSubmit(query.trim());
              setQuery('');
            }}
          >
            Ask Nexus
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelected(file);
            event.currentTarget.value = '';
          }}
        />
      </div>
      <div className="intel-inline-list" style={{ marginTop: 14 }}>
        {suggestedQueries.map((queryText) => (
          <button
            key={queryText}
            type="button"
            className="intel-chip"
            onClick={() => onSuggestedTap(queryText)}
          >
            {queryText}
          </button>
        ))}
      </div>
    </section>
  );
}
