'use client';

import type { NexusTurnData } from '@/lib/intelligence/types';
import { PersonaLensChip } from './PersonaLensChip';
import { CohortCard } from './CohortCard';
import { SourcePill } from './SourcePill';
import { OneSentence } from './formats/OneSentence';
import { Matrix } from './formats/Matrix';
import { Crux } from './formats/Crux';
import { RankedList } from './formats/RankedList';
import { Artifact } from './formats/Artifact';
import { Clarification } from './formats/Clarification';
import { CounterPair } from './formats/CounterPair';
import { IDontKnow } from './formats/IDontKnow';

function renderFormat(
  turn: NexusTurnData,
  onPersonaApply?: (personaKey: string) => void,
  onArtifactAction?: (action: 'download_pdf' | 'download_html' | 'copy' | 'promote') => void,
) {
  switch (turn.format) {
    case 'matrix':
      return <Matrix payload={turn.payload} />;
    case 'crux':
      return <Crux payload={turn.payload} />;
    case 'ranked_list':
      return <RankedList payload={turn.payload} />;
    case 'artifact':
      return <Artifact payload={turn.payload} onAction={onArtifactAction} />;
    case 'clarification':
      return <Clarification payload={turn.payload} onOptionTap={onPersonaApply} />;
    case 'counter_pair':
      return <CounterPair payload={turn.payload} />;
    case 'idk':
      return <IDontKnow payload={turn.payload} />;
    case 'one_sentence':
    default:
      return <OneSentence payload={turn.payload} />;
  }
}

export function NexusTurn({
  turn,
  onPersonaApply,
  onCounterRequest,
  onArtifactAction,
}: {
  turn: NexusTurnData;
  onPersonaApply?: (personaKey: string) => void;
  onCounterRequest?: () => void;
  onArtifactAction?: (action: 'download_pdf' | 'download_html' | 'copy' | 'promote') => void;
}) {
  const personaOptions = ['CFO', 'CIO', 'CMIO', 'Sponsor'];

  if (turn.role === 'user') {
    return (
      <article className="intel-turn user" role="article">
        <div className="intel-turn-header">
          <div className="intel-chip mono">you</div>
          <div className="intel-subtle" style={{ fontSize: 12 }}>
            {new Date(turn.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 16, lineHeight: 1.65 }}>
          {turn.payload.answer ?? turn.payload.hero ?? ''}
        </div>
      </article>
    );
  }

  return (
    <article className="intel-turn nexus" role="article" aria-label="Nexus response">
      <div className="intel-turn-header">
        <div className="intel-inline-list">
          <span className="intel-chip mono teal">Nexus</span>
          {turn.personaKey ? <span className="intel-chip mono blue">{turn.personaKey}</span> : null}
        </div>
        <div className="intel-subtle" style={{ fontSize: 12 }}>
          {new Date(turn.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>

      {turn.contradictionSelfCheck ? (
        <div className="intel-crux" style={{ marginTop: 12 }}>
          <div className="intel-chip mono amber">contradiction self-check</div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            {turn.contradictionSelfCheck.current_departure}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {renderFormat(turn, onPersonaApply, onArtifactAction)}
      </div>

      {turn.personaKey ? (
        <div className="intel-pushback" style={{ marginTop: 12 }}>
          <div className="intel-chip mono blue">same sources, re-weighted only</div>
        </div>
      ) : null}

      <CohortCard sources={turn.sources} />

      {turn.sources.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div className="intel-eyebrow">Sources</div>
          <div className="intel-inline-list" style={{ marginTop: 10 }}>
            {turn.sources.map((source) => (
              <SourcePill key={source.id} source={source} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="intel-turn-footer" style={{ marginTop: 14 }}>
        <div className="intel-inline-list">
          {personaOptions.map((persona) => (
            <PersonaLensChip key={persona} persona={persona} active={turn.personaKey === persona} onClick={() => onPersonaApply?.(persona)} />
          ))}
        </div>
        <div className="intel-inline-list">
          <button type="button" className="intel-button-outline" onClick={onCounterRequest} disabled={!onCounterRequest}>
            Counter
          </button>
        </div>
      </div>
    </article>
  );
}
