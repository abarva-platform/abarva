'use client';

// D04 Intake Synthesis · tension capture section · FM-04
//
// Mirrors D02StakeholderSuccessSection for tensions. Each Tier 1
// stakeholder contributes at least one tension with named owner and
// resolution path. Captured records render as committed views; drafts
// render as empty ProgramTensionForm instances.

import { useState } from 'react';
import { ProgramTensionForm } from '@/components/workflow/ProgramTensionForm';
import type { ProgramTensionRecord } from '@/lib/workflow/stakeholderSuccess';

interface D04SectionProps {
  programCode: string;
  existing: ProgramTensionRecord[];
}

interface DraftSlot {
  draftId: string;
  stakeholderId: string;
  stakeholderName: string;
}

export function D04TensionSection({ programCode, existing }: D04SectionProps) {
  const [committed, setCommitted] = useState<ProgramTensionRecord[]>(existing);
  const [drafts, setDrafts] = useState<DraftSlot[]>([]);
  const [newName, setNewName] = useState('');

  function addDraft() {
    if (!newName.trim()) return;
    const stakeholderId = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setDrafts((d) => [
      ...d,
      {
        draftId: `d-${Date.now()}`,
        stakeholderId,
        stakeholderName: newName.trim(),
      },
    ]);
    setNewName('');
  }

  return (
    <section style={{ marginTop: 28 }}>
      <header style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D97706', fontWeight: 700 }}>
          Phase 1 → 2 gate requirement · FM-04
        </div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, letterSpacing: '-0.015em', margin: '6px 0 0', color: '#1a1612' }}>
          Tension capture
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.55, color: '#544b42' }}>
          Each Tier 1 stakeholder's top tension is captured with category, named owner, and explicit resolution path. Unowned tensions block the phase gate.
        </p>
      </header>

      {committed.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {committed.map((record) => (
            <ProgramTensionForm
              key={record.id}
              programCode={programCode}
              stakeholderId={record.stakeholderId}
              stakeholderName={record.stakeholderName}
              existing={record}
            />
          ))}
        </div>
      ) : null}

      {drafts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {drafts.map((draft) => (
            <ProgramTensionForm
              key={draft.draftId}
              programCode={programCode}
              stakeholderId={draft.stakeholderId}
              stakeholderName={draft.stakeholderName}
              onCommitted={(record) => {
                setCommitted((c) => [...c, record]);
                setDrafts((d) => d.filter((x) => x.draftId !== draft.draftId));
              }}
            />
          ))}
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: 12,
          background: 'rgba(217,119,6,0.06)',
          borderRadius: 10,
          border: '1px dashed rgba(217,119,6,0.35)',
          fontFamily: 'DM Sans, -apple-system, sans-serif',
        }}
      >
        <input
          type="text"
          placeholder="Stakeholder name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(26,22,18,0.15)', fontSize: 13, minWidth: 180 }}
        />
        <button
          type="button"
          onClick={addDraft}
          disabled={!newName.trim()}
          style={{
            padding: '7px 14px',
            borderRadius: 999,
            background: '#D97706',
            color: '#FFFFFF',
            border: 'none',
            cursor: !newName.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            opacity: !newName.trim() ? 0.5 : 1,
          }}
        >
          + Add tension
        </button>
      </div>
    </section>
  );
}
