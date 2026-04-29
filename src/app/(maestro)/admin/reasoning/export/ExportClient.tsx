'use client';

// ExportClient — receives pre-built Markdown string from the server component
// and renders copy / download buttons + a preview pane.

import React, { useState, useCallback } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

interface ExportClientProps {
  markdown: string;
}

// ─── Button styles ────────────────────────────────────────────────────────────

const BTN_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: SHELL.SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.02em',
  borderRadius: 6,
  padding: '8px 18px',
  cursor: 'pointer',
  border: 'none',
  transition: 'opacity 0.15s',
};

const BTN_PRIMARY: React.CSSProperties = {
  ...BTN_BASE,
  background: SHELL.INK,
  color: SHELL.PAPER,
};

const BTN_GHOST: React.CSSProperties = {
  ...BTN_BASE,
  background: 'transparent',
  color: SHELL.INK,
  border: `1.5px solid ${SHELL.INK}`,
};

// ─── Derive a download filename from today's date ─────────────────────────────

function todaySlug(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExportClient({ markdown }: ExportClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the pre element text
      const pre = document.getElementById('report-preview');
      if (pre) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }, [markdown]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reasoning-report-${todaySlug()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [markdown]);

  const lineCount = markdown.split('\n').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Action bar */}
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: SHELL.INK_SOFT,
              fontWeight: 600,
            }}
          >
            Report ready
          </div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 12,
              color: SHELL.INK_MUTED,
              marginTop: 2,
            }}
          >
            {lineCount} lines · reasoning-report-{todaySlug()}.md
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={BTN_GHOST} onClick={handleCopy} type="button">
            {copied ? '✓ Copied!' : 'Copy to clipboard'}
          </button>
          <button style={BTN_PRIMARY} onClick={handleDownload} type="button">
            Download .md
          </button>
        </div>
      </div>

      {/* Preview */}
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            background: SHELL.PAPER_SOFT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: SHELL.INK_SOFT,
            }}
          >
            Markdown preview
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
            }}
          >
            text/markdown
          </span>
        </div>
        <pre
          id="report-preview"
          style={{
            margin: 0,
            padding: '20px 24px',
            fontFamily: SHELL.MONO,
            fontSize: 12,
            lineHeight: 1.65,
            color: SHELL.INK,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '70vh',
            overflowY: 'auto',
            background: 'transparent',
          }}
        >
          {markdown}
        </pre>
      </div>
    </div>
  );
}
