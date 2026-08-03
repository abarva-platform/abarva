"use client";

import type { AiSuccessHomeData } from "@/lib/home/readSkyHarborAiSuccessHome";

import styles from "./AiSuccessCommandCenter.module.css";

export function ArchitectureFlowDiagram({
  data,
  onSelect,
}: {
  data: AiSuccessHomeData;
  onSelect: (ref: string) => void;
}) {
  const totalShown = data.architectureFlow.reduce(
    (sum, stage) => sum + stage.items.length,
    0,
  );

  return (
    <section
      className={styles.flowShell}
      aria-label="SkyHarbor end-to-end current-state architecture flow"
    >
      <header className={styles.flowHeader}>
        <div>
          <span className={styles.eyebrow}>End-to-end current state</span>
          <h3 className={styles.flowTitle}>
            Operational demand flows into AI tools faster than value proof.
          </h3>
          <p className={styles.flowCopy}>
            A curated executive spine from {data.graph.nodes.length} graph nodes
            and {data.graph.edges.length} evidenced flows. Costs are shown only
            where present in the snapshot; empty technical fields are rendered
            as evidence gaps, never decorative blanks.
          </p>
        </div>
        <div className={styles.flowStatGrid}>
          <FlowStat label="Stages" value={data.architectureFlow.length} />
          <FlowStat label="Boxes" value={totalShown} />
          <FlowStat label="AI use cost" value={data.moneyBars[2]?.valueLabel} />
        </div>
      </header>

      <div className={styles.flowBoard}>
        {data.architectureFlow.map((stage, index) => (
          <section key={stage.stageRef} className={styles.flowStage}>
            <div className={styles.flowStageHeader}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stage.title}</strong>
              <small>{stage.subtitle}</small>
            </div>
            <div className={styles.flowStageMetric}>{stage.metric}</div>
            <div className={styles.flowItems}>
              {stage.items.map((item) => (
                <button
                  key={item.ref}
                  type="button"
                  className={styles.flowItem}
                  onClick={() => onSelect(item.ref)}
                >
                  <span className={styles.flowItemTop}>
                    <span className={styles.flowItemKind}>{item.kind}</span>
                    <span
                      className={`${styles.flowEvidenceDot} ${
                        item.evidenceState === "unresolved"
                          ? styles.flowEvidenceUnresolved
                          : ""
                      }`}
                      aria-label={`Evidence state: ${item.evidenceState}`}
                    />
                  </span>
                  <strong>{item.name}</strong>
                  <span>{item.tag}</span>
                  <em>{item.metric}</em>
                  <small>{item.caption}</small>
                </button>
              ))}
            </div>
            {index < data.architectureFlow.length - 1 ? (
              <div className={styles.flowArrow} aria-hidden="true" />
            ) : null}
          </section>
        ))}
      </div>

      <div className={styles.flowFindings}>
        <article>
          <span>Value Gate</span>
          <strong>$0 claimable</strong>
          <p>Usage is visible; finance-attested outcome evidence is not.</p>
        </article>
        <article>
          <span>Commercial Gate</span>
          <strong>$1.4805B contracted</strong>
          <p>
            Annual value is known; clause/page evidence still needs loading.
          </p>
        </article>
        <article>
          <span>Architecture Gate</span>
          <strong>Tier 1 dependency pressure</strong>
          <p>
            AI scale decisions must follow systems, integration and data risk.
          </p>
        </article>
      </div>
    </section>
  );
}

function FlowStat({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <span className={styles.flowStat}>
      <small>{label}</small>
      <strong>{value ?? "0"}</strong>
    </span>
  );
}
