import { TowerIndexPage } from '@/components/tower/TowerIndexPage';
import { TowerProvenanceRibbon } from '@/components/tower/TowerProvenanceRibbon';
import { TowerTopPatternsTile } from '@/components/tower/TowerTopPatternsTile';
import { TowerMissionQueue } from '@/components/tower/TowerMissionQueue';
import { RiskRegisterPanel } from '@/components/_shared/RiskRegisterPanel';
import { buildTowerSynthesisContext } from '@/lib/reasoning/tower-synthesis-context-builder';
import { buildPortfolioRiskRegister } from '@/lib/reasoning/risk-register';
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

  // Portfolio-level risk register: top 10 risks aggregated across every
  // active program + source-event instance, sorted globally by severity
  // and confidence.
  const portfolioRisks = buildPortfolioRiskRegister();

  return (
    <TowerIndexPage
      provenanceSlot={
        <>
          <TowerProvenanceRibbon context={synthesisContext} />
          <RiskRegisterPanel
            risks={portfolioRisks}
            title="Risk register · portfolio"
            maxRows={10}
          />
          <TowerTopPatternsTile />
          <TowerMissionQueue limit={8} />
        </>
      }
    />
  );
}
