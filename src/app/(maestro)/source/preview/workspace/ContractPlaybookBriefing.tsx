import type { ReactNode } from "react";
import { resolveContractPlaybook } from "@/lib/source/contract-intelligence/playbook-crosswalk";
import type { ValueUnit } from "@/lib/source/archetypes/types";

const inputUnits: Record<ValueUnit, string> = {
  usd: "USD",
  usd_per_year: "USD/year",
  pct: "%",
  count: "count",
  fte: "FTE",
  months: "months",
  ratio: "ratio",
};

export function ContractPlaybookBriefing({
  contractArchetype,
  coverageArchetype,
  children,
}: {
  contractArchetype: unknown;
  coverageArchetype?: unknown;
  children?: ReactNode;
}) {
  const resolved = resolveContractPlaybook(
    contractArchetype,
    coverageArchetype,
  );
  const mapped = resolved.state === "mapped" ? resolved : null;
  const evidence = mapped
    ? [
        ...mapped.archetype.requiredEvidenceFamilies,
        ...mapped.archetype.optionalEvidenceFamilies,
      ]
    : [];

  return (
    <section
      className="sw-c3-card sw-c3-playbook"
      aria-label="Contract playbook"
    >
      <div className="sw-c3-eyebrow">AbarVa playbook</div>
      <h3 className="sw-c3-display sw-c3-display-sm">
        {mapped?.mapping.label ??
          (resolved.state === "conflicted"
            ? "Resolve the contract type"
            : "Playbook mapping needed")}
      </h3>
      <p className="sw-c3-prose">
        {mapped?.mapping.focus ??
          (resolved.state === "conflicted"
            ? "The register and evidence coverage declare different contract types. Confirm the governing type before selecting a playbook."
            : "Confirm the contract type and its playbook before assessing commercial levers.")}
      </p>
      {mapped ? (
        <>
          <p className="sw-c3-note">
            Version {mapped.archetype.version}. Guidance, not a completed
            contract assessment.
          </p>
          <details className="sw-c3-playbook-details">
            <summary>
              {mapped.archetype.valueLeverRules!.length} playbook levers
            </summary>
            <p className="sw-c3-note">{mapped.mapping.rationale}</p>
            {mapped.archetype.valueLeverRules!.map((rule) => (
              <details className="sw-c3-playbook-rule" key={rule.key}>
                <summary>{rule.name}</summary>
                <p className="sw-c3-prose">{rule.whatToWatch}</p>
                <dl>
                  <dt>Conditional vendor ask</dt>
                  <dd>{rule.bafoAsk}</dd>
                  <dt>Evidence to assess</dt>
                  <dd>
                    <ul>
                      {rule.requiredEvidence.map((key) => {
                        const family = evidence.find(
                          (item) => item.key === key,
                        );
                        return (
                          <li key={key}>
                            {family?.label ?? key.replaceAll("_", " ")}
                            {family ? ` - ${family.sourceDocHint}` : ""}
                          </li>
                        );
                      })}
                    </ul>
                  </dd>
                  <dt>Calculation inputs</dt>
                  <dd>
                    <ul>
                      {rule.computation.inputs.map((input) => (
                        <li key={input.key}>
                          {input.label}
                          <span className="sw-c3-note">
                            {" "}
                            - {inputUnits[input.unit]}
                            {input.source === "benchmark"
                              ? " - comparable benchmark required"
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                  <dt>Method</dt>
                  <dd>{rule.computation.method}</dd>
                  <dt>Range basis</dt>
                  <dd>{rule.computation.rangeMethod}</dd>
                  {rule.commercialRisk ? (
                    <>
                      <dt>Before acting</dt>
                      <dd>{rule.commercialRisk}</dd>
                    </>
                  ) : null}
                </dl>
                <p className="sw-c3-note">
                  Rule {rule.key} - {rule.computation.formulaId} - playbook v
                  {mapped.archetype.version}
                </p>
              </details>
            ))}
            <p className="sw-c3-note">
              Mapping v{mapped.mapping.version}, declared by{" "}
              {mapped.mapping.declaredBy}. Client approval not recorded.
            </p>
          </details>
        </>
      ) : null}
      {children ? (
        <details className="sw-c3-playbook-details">
          <summary>Source records</summary>
          {children}
        </details>
      ) : null}
    </section>
  );
}
