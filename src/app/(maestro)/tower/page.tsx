import { TowerIndexPage } from '@/components/tower/TowerIndexPage';
import { TowerProvenanceRibbon } from '@/components/tower/TowerProvenanceRibbon';
import { TowerTopPatternsTile } from '@/components/tower/TowerTopPatternsTile';
import { buildTowerSynthesisContext } from '@/lib/reasoning/tower-synthesis-context-builder';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';

export const metadata = { title: 'Control Tower · AbarVa' };

export default function TowerPage() {
  // REASON-29 — Build the portfolio-level Atlas SynthesisContext server-side so
  // the provenance ribbon can surface the inputs that grounded the streamed
  // Atlas synthesis quote (patterns cited, gate counts, blockers, cascades).
  const synthesisContext = buildTowerSynthesisContext(
    APEX_RETAIL_PROGRAM_INSTANCES,
    SOURCE_EVENT_INSTANCES,
  );

  return (
    <TowerIndexPage
      provenanceSlot={
        <>
          <TowerProvenanceRibbon context={synthesisContext} />
          <TowerTopPatternsTile />
        </>
      }
    />
  );
}
