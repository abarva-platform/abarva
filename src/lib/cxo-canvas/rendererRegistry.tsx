import type {
  CxoCanvasGate,
  CxoCanvasItem,
  CxoCanvasPayload,
  CxoCanvasRendererComponent,
  CxoCanvasRendererContext,
  CxoCanvasType,
} from "./canvasTypes";
import { SafeFallbackCanvas } from "./safeFallbackCanvas";
import { validateCxoCanvasPayload } from "./validateCxoCanvasPayload";

export const CXO_CANVAS_RENDERERS = {
  "executive-canvas-sequencing": ExecutiveSequencingCanvas,
  "value-readiness-matrix": ValueReadinessMatrixCanvas,
  "gate-to-value-roadmap": GateToValueRoadmapCanvas,
  "proof-boundary-card": ProofBoundaryCardCanvas,
  "risk-control-heatmap": GenericCxoCanvas,
  "portfolio-allocation-map": GenericCxoCanvas,
  "process-reinvention-map": GenericCxoCanvas,
  "architecture-dependency-map": GenericCxoCanvas,
  "operating-model-canvas": GenericCxoCanvas,
  "thirty-sixty-ninety-roadmap": GenericCxoCanvas,
} satisfies Record<CxoCanvasType, CxoCanvasRendererComponent>;

export function CxoCanvasRenderer({
  payload,
  context,
}: {
  payload: unknown;
  context?: CxoCanvasRendererContext;
}) {
  const result = validateCxoCanvasPayload(payload);
  if (!result.ok) {
    return <SafeFallbackCanvas fallback={result.fallback} context={context} />;
  }
  const Renderer: CxoCanvasRendererComponent =
    CXO_CANVAS_RENDERERS[result.payload.canvasType];
  return <Renderer payload={result.payload} context={context} />;
}

function ExecutiveSequencingCanvas({ payload }: { payload: CxoCanvasPayload }) {
  const items = flattenCanvasItems(payload);
  const plotItems = items.filter(
    (item) =>
      typeof item.value === "number" && typeof item.readiness === "number",
  );
  return (
    <section
      className="nativeCanvas researchCanvas"
      data-testid="executive-canvas-sequencing"
      data-native-canvas-type="executive-canvas-sequencing"
      aria-label={payload.title}
    >
      <style>{CXO_CANVAS_CSS}</style>
      <CanvasHeader eyebrow="Executive sequencing" payload={payload} />
      <div className="researchGrid">
        <div className="researchMatrix" aria-label="Value vs. readiness">
          <div className="matrixTitle">Value vs. readiness</div>
          <div className="matrixAxis matrixAxisY">Value</div>
          <div className="matrixAxis matrixAxisX">Readiness</div>
          {plotItems.map((item, index) => (
            <ResearchPoint
              key={`${item.label}-${index}`}
              item={item}
              index={index}
            />
          ))}
          <div className="chartKey">
            {plotItems.slice(0, 4).map((item, index) => (
              <span key={`${item.label}-key`}>
                <b>{index + 1}</b> {item.label}
              </span>
            ))}
          </div>
        </div>
        <div className="sequenceGrid" aria-label="Funding sequence">
          <h4>Funding sequence</h4>
          {payload.lanes?.map((lane) => (
            <div className="sequenceLane" key={lane.label}>
              <h5>{lane.label}</h5>
              <ul>
                {lane.items.map((item) => (
                  <li key={`${lane.label}-${item.label}`}>
                    <span>{item.label}</span>
                    {item.action ? <em>{item.action}</em> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <ItemDetailStrip items={items} />
      <ProofBoundaryInline payload={payload} />
    </section>
  );
}

function ValueReadinessMatrixCanvas({
  payload,
}: {
  payload: CxoCanvasPayload;
}) {
  const items = flattenCanvasItems(payload);
  return (
    <section
      className="nativeCanvas matrixCanvas"
      data-testid="executive-canvas-matrix"
      data-native-canvas-type="value-readiness-matrix"
      aria-label={payload.title}
    >
      <style>{CXO_CANVAS_CSS}</style>
      <CanvasHeader eyebrow="Portfolio tradeoff" payload={payload} />
      <div className="matrixBoard">
        <div className="matrixQuadrant">
          <h4>High value + high readiness: scale now</h4>
          <ItemPills
            items={items.filter(
              (item) => score(item.value) >= 7 && score(item.readiness) >= 7,
            )}
          />
        </div>
        <div className="matrixQuadrant">
          <h4>High value + low readiness: fund the gate first</h4>
          <ItemPills
            items={items.filter(
              (item) => score(item.value) >= 7 && score(item.readiness) < 7,
            )}
          />
        </div>
        <div className="matrixQuadrant">
          <h4>Lower value + high readiness: sequence behind proof</h4>
          <ItemPills
            items={items.filter(
              (item) => score(item.value) < 7 && score(item.readiness) >= 7,
            )}
          />
        </div>
        <div className="matrixQuadrant">
          <h4>Lower value + low readiness: hold or retire</h4>
          <ItemPills
            items={items.filter(
              (item) => score(item.value) < 7 && score(item.readiness) < 7,
            )}
          />
        </div>
      </div>
      <ItemDetailStrip items={items} />
      <ProofBoundaryInline payload={payload} />
    </section>
  );
}

function GateToValueRoadmapCanvas({ payload }: { payload: CxoCanvasPayload }) {
  const gates = payload.gates?.length
    ? payload.gates
    : flattenCanvasItems(payload).map(itemToGate);
  return (
    <section
      className="nativeCanvas roadmapCanvas"
      data-testid="executive-canvas-roadmap"
      data-native-canvas-type="gate-to-value-roadmap"
      aria-label={payload.title}
    >
      <style>{CXO_CANVAS_CSS}</style>
      <CanvasHeader eyebrow="Gate to value" payload={payload} />
      <ol className="roadmapList">
        {gates.map((gate, index) => (
          <li key={`${gate.label}-${index}`}>
            <span className="roadmapStep">
              {gate.status ?? `Gate ${index + 1}`}
            </span>
            <div>
              <h4>{gate.label}</h4>
              {gate.owner ? <p>{gate.owner}</p> : null}
              {gate.dependency ? <p>{gate.dependency}</p> : null}
              {gate.valueUnlocked ? (
                <strong>{gate.valueUnlocked}</strong>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <ProofBoundaryInline payload={payload} />
    </section>
  );
}

function ProofBoundaryCardCanvas({ payload }: { payload: CxoCanvasPayload }) {
  return (
    <section
      className="nativeCanvas proofCanvas"
      data-testid="executive-canvas-proof"
      data-native-canvas-type="proof-boundary-card"
      aria-label={payload.title}
    >
      <style>{CXO_CANVAS_CSS}</style>
      <CanvasHeader eyebrow="Proof boundary" payload={payload} />
      <ProofBoundaryGrid payload={payload} />
    </section>
  );
}

function GenericCxoCanvas({ payload }: { payload: CxoCanvasPayload }) {
  const items = flattenCanvasItems(payload);
  return (
    <section
      className="nativeCanvas genericCanvas"
      data-testid="cxo-canvas-generic"
      data-native-canvas-type={payload.canvasType}
      aria-label={payload.title}
    >
      <style>{CXO_CANVAS_CSS}</style>
      <CanvasHeader eyebrow="Executive canvas" payload={payload} />
      {payload.metrics?.length ? (
        <div className="metricGrid">
          {payload.metrics.map((metric) => (
            <div key={metric.label} className="metricCard">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.note ? <p>{metric.note}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {items.length ? <ItemDetailStrip items={items} /> : null}
      <ProofBoundaryInline payload={payload} />
    </section>
  );
}

function CanvasHeader({
  eyebrow,
  payload,
}: {
  eyebrow: string;
  payload: CxoCanvasPayload;
}) {
  return (
    <header className="canvasHeader">
      <span>{eyebrow}</span>
      <h3>{payload.title}</h3>
      {payload.summary ? <p>{payload.summary}</p> : null}
      {typeof payload.confidence === "number" ? (
        <small>Confidence {payload.confidence}</small>
      ) : null}
    </header>
  );
}

function ResearchPoint({
  item,
  index,
}: {
  item: CxoCanvasItem;
  index: number;
}) {
  const value = score(item.value);
  const readiness = score(item.readiness);
  const risk = score(item.risk);
  return (
    <div
      className="researchPoint"
      style={{ left: `${8 + readiness * 8.4}%`, bottom: `${8 + value * 8.4}%` }}
      aria-label={`${index + 1}. ${item.label}; Value ${value}; Ready ${readiness}; Risk ${risk}`}
    >
      <span className="researchDot">{index + 1}</span>
      <span className="researchLabel">{item.label}</span>
    </div>
  );
}

function ItemDetailStrip({ items }: { items: CxoCanvasItem[] }) {
  if (!items.length) return null;
  return (
    <div className="itemDetailStrip">
      {items.map((item, index) => (
        <article key={`${item.label}-${index}`} className="itemDetail">
          <h4>{item.label}</h4>
          <div className="scoreRow">
            {typeof item.value === "number" ? (
              <span>Value {item.value}</span>
            ) : null}
            {typeof item.readiness === "number" ? (
              <span>Ready {item.readiness}</span>
            ) : null}
            {typeof item.risk === "number" ? (
              <span>Risk {item.risk}</span>
            ) : null}
          </div>
          {item.action ? <p>{item.action}</p> : null}
          {item.owner ? <p>{item.owner}</p> : null}
          {item.gate ? <p>{item.gate}</p> : null}
          {item.note ? <p>{item.note}</p> : null}
        </article>
      ))}
    </div>
  );
}

function ItemPills({ items }: { items: CxoCanvasItem[] }) {
  if (!items.length)
    return <p className="emptyState">No initiative assigned.</p>;
  return (
    <ul className="itemPills">
      {items.map((item) => (
        <li key={item.label}>
          <span>{item.label}</span>
          {item.gate ? <em>{item.gate}</em> : null}
        </li>
      ))}
    </ul>
  );
}

function ProofBoundaryInline({ payload }: { payload: CxoCanvasPayload }) {
  const decision =
    payload.decisionRequired ?? payload.proofBoundary?.decisionRequired;
  if (!decision && !payload.proofBoundary && !payload.sourceNotes?.length) {
    return null;
  }
  return (
    <aside className="proofBoundaryInline">
      {decision ? (
        <div>
          <span>Decision required</span>
          <strong>{decision}</strong>
        </div>
      ) : null}
      {payload.proofBoundary ? <ProofBoundaryGrid payload={payload} /> : null}
      {payload.sourceNotes?.length ? (
        <div>
          <span>Source notes</span>
          <ul>
            {payload.sourceNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

function ProofBoundaryGrid({ payload }: { payload: CxoCanvasPayload }) {
  const proof = payload.proofBoundary;
  if (!proof) return null;
  const groups = [
    ["Known", proof.known],
    ["Assumed", proof.assumed],
    ["Missing", proof.missing],
  ] as const;
  return (
    <div className="proofBoundaryGrid">
      {groups.map(([label, values]) => (
        <div key={label}>
          <span>{label}</span>
          {values?.length ? (
            <ul>
              {values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          ) : (
            <p>No item stated.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function flattenCanvasItems(payload: CxoCanvasPayload): CxoCanvasItem[] {
  const fromLanes = payload.lanes?.flatMap((lane) => lane.items) ?? [];
  return [...fromLanes, ...(payload.items ?? [])].filter(
    (item, index, all) =>
      all.findIndex((candidate) => candidate.label === item.label) === index,
  );
}

function itemToGate(item: CxoCanvasItem): CxoCanvasGate {
  return {
    label: item.gate ?? item.label,
    owner: item.owner,
    dependency: item.dependency ?? item.note,
    valueUnlocked: item.valueUnlocked ?? item.action,
    status: item.status,
  };
}

function score(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(10, value))
    : 5;
}

const CXO_CANVAS_CSS = `
.nativeCanvas {
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  background: #fff;
  color: #172033;
  display: grid;
  gap: 16px;
  padding: 18px;
}
.canvasHeader span,
.proofBoundaryInline span,
.proofBoundaryGrid span,
.metricCard span {
  color: #64748b;
  display: block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.canvasHeader h3 {
  font-size: 20px;
  line-height: 1.2;
  margin: 4px 0 6px;
}
.canvasHeader p,
.canvasHeader small {
  color: #526173;
  display: block;
  margin: 0;
}
.researchGrid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(280px, 1fr) minmax(220px, 0.72fr);
}
.researchMatrix {
  aspect-ratio: 1.25 / 1;
  background:
    linear-gradient(to right, rgba(15, 23, 42, 0.08) 1px, transparent 1px),
    linear-gradient(to top, rgba(15, 23, 42, 0.08) 1px, transparent 1px),
    #f8fafc;
  background-size: 20% 20%;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  min-height: 260px;
  overflow: hidden;
  position: relative;
}
.matrixTitle {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  font-weight: 800;
  left: 12px;
  padding: 6px 8px;
  position: absolute;
  top: 12px;
}
.matrixAxis {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  position: absolute;
}
.matrixAxisY {
  left: 12px;
  top: 48%;
  transform: rotate(-90deg);
  transform-origin: left center;
}
.matrixAxisX {
  bottom: 10px;
  right: 14px;
}
.researchPoint {
  align-items: center;
  display: flex;
  gap: 6px;
  position: absolute;
  transform: translate(-50%, 50%);
  white-space: nowrap;
}
.researchDot {
  align-items: center;
  background: #0f766e;
  border: 2px solid #fff;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
  color: #fff;
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  height: 28px;
  justify-content: center;
  width: 28px;
}
.researchLabel {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  max-width: 170px;
  overflow: hidden;
  padding: 4px 6px;
  text-overflow: ellipsis;
}
.chartKey {
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(15, 23, 42, 0.1);
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  left: 0;
  padding: 8px 10px;
  position: absolute;
  right: 0;
}
.chartKey span {
  color: #334155;
  font-size: 12px;
}
.sequenceGrid,
.matrixQuadrant,
.itemDetail,
.metricCard {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  padding: 12px;
}
.sequenceGrid h4,
.sequenceLane h5,
.matrixQuadrant h4,
.itemDetail h4,
.roadmapList h4 {
  margin: 0 0 8px;
}
.sequenceLane + .sequenceLane {
  border-top: 1px solid rgba(15, 23, 42, 0.1);
  margin-top: 10px;
  padding-top: 10px;
}
.sequenceLane ul,
.itemPills,
.proofBoundaryGrid ul,
.proofBoundaryInline ul,
.roadmapList {
  margin: 0;
  padding-left: 18px;
}
.sequenceLane li,
.itemPills li {
  margin: 6px 0;
}
.sequenceLane em,
.itemPills em {
  color: #64748b;
  display: block;
  font-style: normal;
  font-size: 12px;
}
.itemDetailStrip,
.metricGrid,
.matrixBoard {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
}
.scoreRow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.scoreRow span {
  background: #ecfdf5;
  border-radius: 999px;
  color: #065f46;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 8px;
}
.itemDetail p,
.matrixQuadrant p,
.roadmapList p {
  color: #526173;
  margin: 6px 0 0;
}
.proofBoundaryInline {
  border-top: 1px solid rgba(15, 23, 42, 0.12);
  display: grid;
  gap: 12px;
  padding-top: 12px;
}
.proofBoundaryInline strong {
  display: block;
  margin-top: 4px;
}
.proofBoundaryGrid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
.roadmapList {
  display: grid;
  gap: 10px;
  list-style: none;
  padding-left: 0;
}
.roadmapList li {
  align-items: flex-start;
  display: grid;
  gap: 12px;
  grid-template-columns: 88px 1fr;
}
.roadmapStep {
  background: #eef2ff;
  border-radius: 999px;
  color: #3730a3;
  font-size: 12px;
  font-weight: 800;
  padding: 5px 8px;
  text-align: center;
}
.metricCard strong {
  display: block;
  font-size: 22px;
  margin-top: 4px;
}
@media (max-width: 760px) {
  .researchGrid,
  .roadmapList li {
    grid-template-columns: 1fr;
  }
  .researchPoint {
    white-space: normal;
  }
}
`;
