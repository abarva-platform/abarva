'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { TRANSITIONS } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  clientId: string;
}

const TEAL = '#14B8A6';
const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const CORAL = '#FF6B4A';
const FONT_MONO = 'JetBrains Mono, monospace';
const ACCEPTED = '.csv,.json,.xlsx,.xls,.pdf,.txt';

interface UploadResult {
  file_id: string;
  data_type: string;
  classification_confidence: number;
  status: string;
  rows_ingested: number | null;
  message: string;
  notes: string[];
}

export function TowerUploadZone({ clientId }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append('clientId', clientId);
      form.append('file', file);
      const res = await fetch('/api/tower/upload', { method: 'POST', body: form });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? `HTTP ${res.status}`);
      setResult(data as unknown as UploadResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = '';
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => inputRef.current?.click()}
        style={{
          padding: 24,
          background: dragActive ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.04)',
          border: `1px dashed ${dragActive ? TEAL : 'rgba(20,184,166,0.4)'}`,
          borderRadius: 12,
          textAlign: 'center',
          cursor: 'pointer',
          transition: reducedMotion ? undefined : `background-color ${TRANSITIONS.hover}, border-color ${TRANSITIONS.hover}`,
        }}
      >
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
          Upload data
        </div>
        <div style={{ fontSize: 14, color: INK, marginBottom: 6 }}>
          {uploading ? 'Classifying & ingesting…' : 'Drop any file — I\'ll figure out what it is'}
        </div>
        <div style={{ fontSize: 12, color: MUTE }}>
          CSV · Excel · JSON · PDF · Cloud billing exports · Vendor usage reports · max 25MB
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,107,74,0.08)', border: '0.5px solid rgba(255,107,74,0.3)', borderRadius: 8, color: CORAL, fontSize: 12, fontFamily: FONT_MONO }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: 12,
          padding: 14,
          background: result.status === 'parsed' ? 'rgba(20,184,166,0.06)' : 'rgba(245,197,74,0.08)',
          border: `0.5px solid ${result.status === 'parsed' ? 'rgba(20,184,166,0.3)' : 'rgba(245,197,74,0.3)'}`,
          borderRadius: 10,
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', color: result.status === 'parsed' ? TEAL : '#F5C54A', textTransform: 'uppercase', marginBottom: 6 }}>
            {result.data_type} · {Math.round(result.classification_confidence * 100)}% confidence · {result.status}
          </div>
          <div style={{ fontSize: 13, color: INK, lineHeight: 1.5 }}>{result.message}</div>
          {result.notes?.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTE, cursor: 'pointer' }}>notes ({result.notes.length})</summary>
              <pre style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTE, margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>
                {result.notes.join('\n')}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
