import { GovernedStatePanel } from "../state/GovernedStatePanel";

/**
 * `Goal` is not yet a ratified canonical object type in the consumption
 * contract (see the reconciliation matrix's `listGoals` row: no goal_v1
 * projection exists anywhere in the registry). The assembler deliberately
 * does not expose a `getGoals` method, and per the migration guide this
 * section renders its honest PROJECTION_UNAVAILABLE state directly rather
 * than silently reusing `getTopOpportunities` as a stand-in for Goals --
 * Opportunities and Goals are not the same object, and presenting one as the
 * other would misrepresent what is actually governed.
 */
export function GoalsPanel() {
  return (
    <GovernedStatePanel
      title="Goals not yet published"
      body="Goal is not yet a ratified canonical object type in the consumption contract. The page does not synthesize goals from opportunities, program titles, or interview fragments."
      detail="Required publication: canonical goal object type or approved goal projection."
    />
  );
}
