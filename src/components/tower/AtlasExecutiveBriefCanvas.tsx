import React from "react";
import type { AtlasExecutiveBriefView } from "@/lib/tower/atlas-executive-brief-canvas";

interface AtlasExecutiveBriefCanvasProps {
  view: AtlasExecutiveBriefView;
}

export function AtlasExecutiveBriefCanvas({
  view,
}: AtlasExecutiveBriefCanvasProps) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: "800px" }}>
      {/* Executive Brief — dark panel (approved for high-impact use) */}
      <div
        style={{
          backgroundColor: "#0F1E3F",
          color: "#FFFFFF",
          padding: "20px 24px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "#9AA3B2",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          AVA · EXECUTIVE BRIEF
        </div>
        <div
          data-testid="atlas-brief-accountability-label"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 7px",
            border: "1px solid #33456F",
            borderRadius: "3px",
            color: "#D1D5DB",
            fontSize: "10px",
            fontWeight: 600,
            marginBottom: "10px",
          }}
        >
          {view.accountabilityDisclosure.decisionSupportLabel} · human review
          required
        </div>
        <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
          {view.briefTitle}
        </div>
        <div style={{ fontSize: "13px", color: "#D1D5DB", lineHeight: "1.5" }}>
          {view.briefSummary}
        </div>
        {view.commercialSignalNote && (
          <div
            style={{
              fontSize: "11px",
              color: "#9AA3B2",
              marginTop: "10px",
              borderTop: "1px solid #1F2F5A",
              paddingTop: "10px",
            }}
          >
            Commercial signal: {view.commercialSignalNote}
          </div>
        )}
      </div>

      {/* Signal cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {[view.topValueSignal, view.topRiskSignal, view.adoptionSignal].map(
          (signal, i) => (
            <div
              key={i}
              style={{
                padding: "14px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E6E1",
                borderTop: `3px solid ${signal.signalType === "risk" ? "#B91C1C" : "#1B2B5C"}`,
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#525866",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                {signal.signalType.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0A0C12",
                  marginBottom: "6px",
                }}
              >
                {signal.label}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#525866",
                  marginBottom: "6px",
                }}
              >
                {signal.summary}
              </div>
              <div style={{ fontSize: "10px", color: "#9AA3B2" }}>
                {signal.businessImpact}
              </div>
            </div>
          ),
        )}
      </div>

      {/* Missing data + recommended action */}
      {view.missingData.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#FFF7ED",
            border: "1px solid #F59E0B",
            borderRadius: "4px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#92400E",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Missing data
          </div>
          {view.missingData.map((item, i) => (
            <div key={i} style={{ fontSize: "11px", color: "#0A0C12" }}>
              · {item}
            </div>
          ))}
        </div>
      )}

      {/* Slice 3.4 — adoption & value-realization instrumentation */}
      {view.valueRealization && (
        <div
          data-testid="atlas-brief-value-realization"
          style={{
            padding: "12px 14px",
            backgroundColor: "#F8F7F4",
            border: "1px solid #E8E6E1",
            borderRadius: "4px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#525866",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            Value realization
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#0A0C12",
              lineHeight: "1.5",
              marginBottom: "6px",
            }}
          >
            {view.valueRealization.earningSummary}
          </div>
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              fontSize: "10px",
              color: "#525866",
            }}
          >
            <span>
              Realization:{" "}
              <strong style={{ color: "#0A0C12" }}>
                {view.valueRealization.realizationRatio === null
                  ? "not computable"
                  : `${Math.round(view.valueRealization.realizationRatio * 100)}%`}
              </strong>{" "}
              · {view.valueRealization.realizationSeverity.replace("_", " ")}
            </span>
            <span>
              Adoption:{" "}
              <strong style={{ color: "#0A0C12" }}>
                {view.valueRealization.adoptionState.replace("_", " ")}
              </strong>
            </span>
          </div>
          {view.valueRealization.adoptionInstrumentationGap && (
            <div
              style={{ fontSize: "10px", color: "#92400E", marginTop: "6px" }}
            >
              {view.valueRealization.adoptionHeadline}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          padding: "10px 14px",
          backgroundColor: "#F0F2F7",
          borderRadius: "4px",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, color: "#1B2B5C" }}>
          Ava recommends:{" "}
        </span>
        <span style={{ fontSize: "11px", color: "#0A0C12" }}>
          {view.recommendedExecutiveAction}
        </span>
      </div>

      <div
        data-testid="atlas-brief-accountability-disclosure"
        style={{
          padding: "12px 14px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #D6D3CC",
          borderRadius: "4px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "#525866",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "6px",
          }}
        >
          Accountability disclosure
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#0A0C12",
            lineHeight: "1.5",
            marginBottom: "6px",
          }}
        >
          {view.accountabilityDisclosure.humanDecisionBoundary}
        </div>
        <div style={{ fontSize: "10px", color: "#525866", lineHeight: "1.5" }}>
          {view.accountabilityDisclosure.citationSummary}{" "}
          {view.accountabilityDisclosure.assumptionDisclosure}
        </div>
        {view.accountabilityDisclosure.citations.length > 0 && (
          <div style={{ display: "grid", gap: "3px", marginTop: "8px" }}>
            {view.accountabilityDisclosure.citations
              .slice(0, 4)
              .map((citation, i) => (
                <div
                  key={`${citation}-${i}`}
                  style={{
                    fontSize: "10px",
                    color: "#525866",
                    lineHeight: "1.35",
                  }}
                >
                  Citation {i + 1}: {citation}
                </div>
              ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: "10px", color: "#9AA3B2" }}>
        {view.deterministicSeedCaveat}
      </div>
    </div>
  );
}
