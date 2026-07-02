import type {
  CxoCanvasFallback,
  CxoCanvasRendererContext,
} from "./canvasTypes";

export function SafeFallbackCanvas({
  fallback,
}: {
  fallback?: CxoCanvasFallback;
  context?: CxoCanvasRendererContext;
}) {
  return (
    <section
      className="cxoFallbackCanvas"
      data-testid="cxo-canvas-fallback"
      data-native-canvas-type="safe-fallback"
      aria-label="Executive canvas fallback"
    >
      <style>{CXO_FALLBACK_CSS}</style>
      <p className="cxoFallbackEyebrow">Structured recommendation</p>
      <h3>
        {fallback?.title ??
          "Executive canvas unavailable. Showing structured recommendation summary."}
      </h3>
      <p>
        Executive canvas unavailable. Showing structured recommendation summary.
      </p>
      {fallback?.summary ? <p>{fallback.summary}</p> : null}
      {fallback?.decisionRequired ? (
        <div className="cxoFallbackDecision">
          <span>Decision required</span>
          <strong>{fallback.decisionRequired}</strong>
        </div>
      ) : null}
      {fallback?.proofBoundary?.missing?.length ? (
        <div className="cxoFallbackProof">
          <span>Missing proof</span>
          <ul>
            {fallback.proofBoundary.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const CXO_FALLBACK_CSS = `
.cxoFallbackCanvas {
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  background: #ffffff;
  color: #172033;
  padding: 18px;
}
.cxoFallbackCanvas h3 {
  margin: 4px 0 8px;
  font-size: 18px;
  line-height: 1.25;
}
.cxoFallbackCanvas p {
  margin: 0 0 10px;
  color: #526173;
}
.cxoFallbackEyebrow,
.cxoFallbackDecision span,
.cxoFallbackProof span {
  display: block;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cxoFallbackDecision,
.cxoFallbackProof {
  border-top: 1px solid rgba(15, 23, 42, 0.1);
  margin-top: 12px;
  padding-top: 12px;
}
.cxoFallbackDecision strong {
  display: block;
  margin-top: 4px;
  font-size: 14px;
}
.cxoFallbackProof ul {
  margin: 6px 0 0;
  padding-left: 18px;
}
`;
