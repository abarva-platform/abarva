'use client';

// D02 Stakeholder Map · success-definition capture section · FM-04
//
// Renders below the D02 body. Shows existing success records + an
// "add another stakeholder" affordance. Each record renders as a
// StakeholderSuccessForm instance — empty form when adding, CommittedView
// when the record is persisted.
//
// This is the minimum viable integration. Full per-stakeholder
// enforcement (with a canonical Tier 1 stakeholder list from the program
// seed) is a follow-up once Codex's stakeholder resolver lands.

import { useState } from 'react';
import { StakeholderSuccessForm } from '@/components/workflow/StakeholderSuccessForm';
import type { StakeholderSuccessRecord } from '@/lib/workflow/stakeholderSuccess';

interface D02SectionProps {
  programCode: string;
  existing: StakeholderSuccessRecord[];
}

interface DraftSlot {
  draftId: string;
  stakeholderId: string;
  stakeholderName: string;
  stakeholderRole: string;
}

export function D02StakeholderSuccessSection({ programCode, existing }: D02SectionProps) {
  const [committed, setCommitted] = useState<StakeholderSuccessRecord[]>(existing);
  const [drafts, setDrafts] = useState<DraftSlot[]>([]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');

  function addDraft() {
    if (!newName.trim() || !newRole.trim()) return;
    const stakeholderId = `${newName}-${newRole}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setDrafts((d) => [
      ...d,
      {
        draftId: `d-${Date.now()}`,
        stakeholderId,
        stakeholderName: newName.trim(),
        stakeholderRole: newRole.trim(),
      },
    ]);
    setNewName('');
    setNewRole('');
  }

  return (
    <section style={{ marginTop: 28 }}>
      <header style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9B6DFF', fontWeight: 700 }}>
          Phase 1 → 2 gate requirement · FM-04
        </div>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 24, letterSpacing: '-0.015em', margin: '6px 0 0', color: '#1a1612' }}>
          Stakeholder success definitions
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.55, color: '#544b42' }}>
          Each Tier 1 stakeholder declares what success looks like — measurably. Phase 1 → 2 gate requires at least one captured definition; production enforcement extends to per-stakeholder coverage once the stakeholder resolver lands.
        </p>
      </header>

      {committed.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {committed.map((record) => (
            <StakeholderSuccessForm
              key={record.id}
              programCode={programCode}
              stakeholderId={record.stakeholderId}
              stakeholderName={record.stakeholderName}
              stakeholderRole={record.stakeholderRole}
              existing={record}
            />
          ))}
        </div>
      ) : null}

      {drafts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {drafts.map((draft) => (
            <StakeholderSuccessForm
              key={draft.draftId}
              programCode={programCode}
              stakeholderId={draft.stakeholderId}
              stakeholderName={draft.stakeholderName}
              stakeholderRole={draft.stakeholderRole}
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
          background: 'rgba(155,109,255,0.06)',
          borderRadius: 10,
          border: '1px dashed rgba(155,109,255,0.35)',
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
        <input
          type="text"
          placeholder="Role (e.g. CMO)"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(26,22,18,0.15)', fontSize: 13, minWidth: 140 }}
        />
        <button
          type="button"
          onClick={addDraft}
          disabled={!newName.trim() || !newRole.trim()}
          style={{
            padding: '7px 14px',
            borderRadius: 999,
            background: '#9B6DFF',
            color: '#FFFFFF',
            border: 'none',
            cursor: !newName.trim() || !newRole.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            opacity: !newName.trim() || !newRole.trim() ? 0.5 : 1,
          }}
        >
          + Add stakeholder
        </button>
      </div>
    </section>
  );
}
