'use client';

import type { NexusTurnData } from '@/lib/intelligence/types';
import { NexusTurn } from '@/components/intelligence/NexusTurn';
import { NexusStatus } from './NexusStatus';

export function NexusConversation({
  turns,
  pending,
  onPersonaApply,
  onCounterRequest,
  onArtifactAction,
}: {
  turns: NexusTurnData[];
  pending: {
    active: boolean;
    mode: string | null;
    format: string | null;
    progress: Array<{ phase: string; status: string; latencyMs?: number }>;
  };
  onPersonaApply: (turnId: string, personaKey: string) => void;
  onCounterRequest: (turnId: string) => void;
  onArtifactAction: (turn: NexusTurnData, action: 'download_pdf' | 'download_html' | 'copy' | 'promote') => void;
}) {
  return (
    <div className="intel-turn-stack">
      {turns.map((turn) => (
        <NexusTurn
          key={turn.id}
          turn={turn}
          onPersonaApply={turn.role === 'nexus' ? (personaKey) => onPersonaApply(turn.id, personaKey) : undefined}
          onCounterRequest={turn.role === 'nexus' ? () => onCounterRequest(turn.id) : undefined}
          onArtifactAction={turn.role === 'nexus' ? (action) => onArtifactAction(turn, action) : undefined}
        />
      ))}
      {pending.active ? <NexusStatus mode={pending.mode} format={pending.format} progress={pending.progress} /> : null}
    </div>
  );
}
