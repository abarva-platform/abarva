import type { SourceArtifactDetail } from '@/lib/source/types';
import { sourceCard, sourceInsetCard } from './foundationStyles';

export function SourceArtifactDrawer({ artifact }: { artifact: SourceArtifactDetail }) {
  return (
    <section style={sourceCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>{artifact.kind.replace('_', ' ')}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{artifact.title}</div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.72 }}>{artifact.status.replace('_', ' ')}</div>
      </div>
      <div>{artifact.summary}</div>
      {artifact.sections.map((section) => (
        <div key={section.label} style={sourceInsetCard}>
          <div style={{ fontWeight: 700 }}>{section.label}</div>
          <div>{section.body}</div>
        </div>
      ))}
      <div style={sourceInsetCard}>
        <div style={{ fontWeight: 700 }}>Governance notes</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {artifact.governanceNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
