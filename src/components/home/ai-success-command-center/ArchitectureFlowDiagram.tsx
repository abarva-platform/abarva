import styles from "./ArchitectureFlowDiagram.module.css";

interface FlowBox {
  title: string;
  subtitle: string;
  tag: string;
}

interface FlowStage {
  key: string;
  label: string;
  hint: string;
  boxes: FlowBox[];
}

interface Props {
  stages: FlowStage[];
  crossCutting: { label: string; note: string };
}

export function ArchitectureFlowDiagram({ stages, crossCutting }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {stages.map((stage, index) => (
          <div key={stage.key} className={styles.stageWrap}>
            <div className={styles.stage}>
              <div className={styles.stageHeader}>
                <span className={styles.stageLabel}>{stage.label}</span>
                <span className={styles.stageHint}>{stage.hint}</span>
              </div>
              <div className={styles.boxes}>
                {stage.boxes.map((box, boxIndex) => (
                  <div key={box.title + boxIndex} className={styles.box}>
                    <div className={styles.boxTitle}>{box.title}</div>
                    <div className={styles.boxSubtitle}>{box.subtitle}</div>
                    <div className={styles.boxTag}>{box.tag}</div>
                  </div>
                ))}
              </div>
            </div>
            {index < stages.length - 1 ? (
              <div className={styles.arrow} aria-hidden="true">
                →
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className={styles.crossCutting}>
        <span className={styles.crossCuttingLabel}>{crossCutting.label}</span>
        <span className={styles.crossCuttingNote}>{crossCutting.note}</span>
      </div>
    </div>
  );
}
