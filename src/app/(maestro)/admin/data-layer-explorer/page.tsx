import { connection } from "next/server";

import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { ContextBar } from "@/components/admin/ContextBar";
import { EditorialCanvas } from "@/components/admin/EditorialCanvas";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import {
  buildAdminDataLayerExplorerModel,
  type DataJourneyGuardrail,
  type DataJourneyInputCategory,
  type DataJourneyPageMapping,
  type DataJourneyQualityCheck,
  type DataJourneySection,
} from "@/lib/admin/data-layer-explorer";
import { SHELL } from "@/lib/shell/shell-tokens";

export const metadata = {
  title: "Data Layer Explorer | AbarVa Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cardStyle = {
  border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
} as const;

const labelStyle = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  fontWeight: 800,
} as const;

export default async function AdminDataLayerExplorerPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const model = buildAdminDataLayerExplorerModel(tenant.tenantName);

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <EditorialCanvas
        eyebrow="Admin / Data Journey"
        title={model.title}
        subtitle={model.subtitle}
      >
        <style>
          {`
            html {
              scroll-behavior: smooth;
            }
            [data-admin-data-layer-explorer] {
              --journey-ink: ${SHELL.INK};
              --journey-muted: ${SHELL.INK_MUTED};
              --journey-line: ${SHELL.CARD_LINE_SOFT};
            }
            [data-data-journey-left-nav] a {
              color: ${SHELL.INK_SOFT};
              text-decoration: none;
            }
            [data-data-journey-left-nav] a:hover {
              color: ${SHELL.INK};
            }
            @media (max-width: 1100px) {
              [data-data-journey-grid] {
                grid-template-columns: minmax(0, 1fr) !important;
              }
              [data-data-journey-left-nav] {
                position: static !important;
                max-height: none !important;
              }
            }
          `}
        </style>
        <ContextBar
          tenant={tenant.tenantName}
          mode="Read-only"
          agent="Steward"
          data={`${model.sections.length} sections · ${model.inputCategories.length} input categories`}
          liveStatus="No writes"
          liveStatusKind="live"
        />

        <div data-admin-data-layer-explorer>
          <section
            style={{
              ...cardStyle,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
              gap: 18,
              padding: 20,
              marginBottom: 18,
            }}
          >
            <div>
              <p style={labelStyle}>Truth split</p>
              <h2 style={{ margin: "8px 0", fontSize: 24, color: SHELL.INK }}>
                Read-only map, not an execution console.
              </h2>
              <p
                style={{
                  margin: 0,
                  color: SHELL.INK_SOFT,
                  fontSize: 15,
                  lineHeight: 1.6,
                  maxWidth: 920,
                }}
              >
                This page explains where client files go, what becomes evidence,
                what is only candidate data, what can be promoted later, and
                which modules are allowed to use each layer.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {[
                ["production writes", "false"],
                ["candidate creation", "false"],
                ["candidate promotion", "false"],
                ["runtime change", "false"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                    borderRadius: 8,
                    padding: 12,
                    background: "#F7FAF8",
                  }}
                >
                  <p style={{ ...labelStyle, margin: 0 }}>{label}</p>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontFamily: SHELL.MONO,
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#0F766E",
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            data-data-journey-grid
            style={{
              display: "grid",
              gridTemplateColumns: "260px minmax(0, 1fr)",
              gap: 20,
              alignItems: "start",
            }}
          >
            <nav
              data-data-journey-left-nav
              aria-label="Data journey sections"
              style={{
                ...cardStyle,
                position: "sticky",
                top: 20,
                maxHeight: "calc(100vh - 104px)",
                overflow: "auto",
                padding: 12,
              }}
            >
              <p style={{ ...labelStyle, margin: "4px 8px 10px" }}>Explorer</p>
              <div style={{ display: "grid", gap: 2 }}>
                {model.sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "26px minmax(0, 1fr)",
                      gap: 8,
                      alignItems: "center",
                      padding: "9px 8px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: index === 0 ? SHELL.INK : "#EAF4F2",
                        color: index === 0 ? SHELL.CARD_WHITE : "#0F766E",
                        fontFamily: SHELL.MONO,
                        fontSize: 10,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span>{section.navLabel}</span>
                  </a>
                ))}
              </div>
            </nav>

            <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
              <FlowPanel
                steps={model.pipelineSteps.map((step) => step.label)}
              />
              {model.sections.map((section) => (
                <JourneySection
                  key={section.id}
                  section={section}
                  inputCategories={
                    section.id === "input-files" ? model.inputCategories : []
                  }
                  pageMappings={
                    section.id === "page-mapping" ? model.pageMappings : []
                  }
                  qualityChecks={
                    section.id === "quality-checks" ? model.qualityChecks : []
                  }
                  guardrails={
                    section.id === "guardrails" ? model.guardrails : []
                  }
                />
              ))}
            </div>
          </section>
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}

function FlowPanel({ steps }: { steps: string[] }) {
  return (
    <section
      style={{ ...cardStyle, padding: 18 }}
      aria-label="Input to active access flow"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <div>
          <p style={{ ...labelStyle, margin: 0 }}>Governed flow</p>
          <h2 style={{ margin: "6px 0 0", fontSize: 22, color: SHELL.INK }}>
            From input files to module context
          </h2>
        </div>
        <p
          style={{
            margin: 0,
            color: SHELL.INK_MUTED,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {steps.length} controlled steps
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 8,
        }}
      >
        {steps.map((step, index) => (
          <div
            key={step}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 10,
              background: index < 13 ? "#FFFFFF" : "#FFF8ED",
              minHeight: 74,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#0F766E",
                fontFamily: SHELL.MONO,
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </p>
            <p
              style={{
                margin: "6px 0 0",
                color: SHELL.INK,
                fontSize: 13,
                fontWeight: 800,
                lineHeight: 1.35,
              }}
            >
              {step}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function JourneySection({
  section,
  inputCategories,
  pageMappings,
  qualityChecks,
  guardrails,
}: {
  section: DataJourneySection;
  inputCategories: DataJourneyInputCategory[];
  pageMappings: DataJourneyPageMapping[];
  qualityChecks: DataJourneyQualityCheck[];
  guardrails: DataJourneyGuardrail[];
}) {
  return (
    <section
      id={section.id}
      data-data-journey-section={section.id}
      style={{ ...cardStyle, padding: 22, scrollMarginTop: 18 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 14,
          alignItems: "start",
          marginBottom: 18,
        }}
      >
        <div>
          <p style={{ ...labelStyle, margin: 0 }}>
            {section.internalName
              ? `${section.navLabel} · ${section.internalName}`
              : section.navLabel}
          </p>
          <h2 style={{ margin: "8px 0", fontSize: 26, color: SHELL.INK }}>
            {section.title}
          </h2>
          <p
            style={{
              margin: 0,
              color: SHELL.INK_SOFT,
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 940,
            }}
          >
            {section.plainEnglish}
          </p>
        </div>
        <StatusPill>{section.currentStatus}</StatusPill>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <ListPanel title="What goes in" items={section.goesIn} />
        <ListPanel title="What comes out" items={section.comesOut} />
        <ListPanel title="Used by" items={section.usedBy} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <ListPanel title="Example records" items={section.exampleRecords} />
        <ListPanel title="What can go wrong" items={section.whatCanGoWrong} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <ListPanel title="Quality checks" items={section.qualityChecks} />
        <ListPanel title="Guardrails" items={section.guardrails} />
      </div>

      {inputCategories.length ? (
        <InputCategoryGrid categories={inputCategories} />
      ) : null}
      {pageMappings.length ? <PageMappingGrid mappings={pageMappings} /> : null}
      {qualityChecks.length ? (
        <QualityCheckGrid checks={qualityChecks} />
      ) : null}
      {guardrails.length ? <GuardrailGrid guardrails={guardrails} /> : null}
    </section>
  );
}

function StatusPill({ children }: { children: string }) {
  return (
    <span
      style={{
        maxWidth: 300,
        border: "1px solid #C7E8DF",
        borderRadius: 999,
        padding: "8px 10px",
        background: "#F0FBF8",
        color: "#0F766E",
        fontSize: 12,
        fontWeight: 900,
        lineHeight: 1.35,
      }}
    >
      {children}
    </span>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: 8,
        padding: 14,
        background: "#FCFBF8",
        minWidth: 0,
      }}
    >
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>{title}</p>
      <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 7 }}>
        {items.map((item) => (
          <li
            key={item}
            style={{
              color: SHELL.INK_SOFT,
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InputCategoryGrid({
  categories,
}: {
  categories: DataJourneyInputCategory[];
}) {
  return (
    <div data-input-category-grid style={{ marginTop: 18 }}>
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>
        Input category catalogue
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: 12,
        }}
      >
        {categories.map((category) => (
          <article
            key={category.id}
            data-input-category={category.id}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 14,
              background: "#FFFFFF",
              display: "grid",
              gap: 10,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: SHELL.INK }}>
                {category.label}
              </h3>
              <p
                style={{
                  margin: "6px 0 0",
                  color: SHELL.INK_SOFT,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {category.purpose}
              </p>
            </div>
            <CompactMeta label="Owner" value={category.owner} />
            <CompactMeta
              label="Accepted"
              value={category.acceptedFileTypes.join(", ")}
            />
            <CompactMeta
              label="Required"
              value={category.requiredFields.join(", ")}
            />
            <CompactMeta
              label="Optional"
              value={category.optionalFields.join(", ")}
            />
            <CompactMeta label="Mapped layer" value={category.mappedLayer} />
            <CompactMeta
              label="Module impact"
              value={category.moduleImpact.join(", ")}
            />
            <CompactMeta
              label="Readiness impact"
              value={category.readinessImpact}
            />
            <div
              style={{
                borderRadius: 8,
                background: "#F8FAFC",
                padding: 10,
                border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              }}
            >
              <p style={{ ...labelStyle, margin: "0 0 6px" }}>Example row</p>
              <code
                style={{
                  display: "block",
                  whiteSpace: "normal",
                  color: SHELL.INK,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {Object.entries(category.sampleRow)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(" · ")}
              </code>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function PageMappingGrid({ mappings }: { mappings: DataJourneyPageMapping[] }) {
  return (
    <div data-page-layer-map style={{ marginTop: 18 }}>
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>Page-to-layer map</p>
      <div style={{ display: "grid", gap: 12 }}>
        {mappings.map((mapping) => (
          <article
            key={mapping.page}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 18, color: SHELL.INK }}>
              {mapping.page}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              <ListPanel title="Reads from" items={mapping.readsFrom} />
              <ListPanel title="Writes to" items={mapping.writesTo} />
              <ListPanel
                title="Does not write to"
                items={mapping.doesNotWriteTo}
              />
              <ListPanel title="Depends on" items={mapping.dependsOn} />
              <ListPanel title="Guardrails" items={mapping.guardrails} />
              <ListPanel title="Caveats" items={mapping.caveats} />
            </div>
            <p
              style={{
                margin: "12px 0 0",
                color: "#0F766E",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              Current wiring: {mapping.currentWiringStatus}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function QualityCheckGrid({ checks }: { checks: DataJourneyQualityCheck[] }) {
  return (
    <div data-quality-checks style={{ marginTop: 18 }}>
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>
        Quality check catalogue
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {checks.map((check) => (
          <article
            key={check.id}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: SHELL.INK }}>
              {check.label}
            </h3>
            <p
              style={{
                margin: "8px 0",
                color: SHELL.INK_SOFT,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {check.purpose}
            </p>
            <CompactMeta
              label="Applies to"
              value={check.appliesTo.join(", ")}
            />
            <CompactMeta label="Status" value={check.currentStatus} />
            <CompactMeta label="Failure mode" value={check.failureMode} />
          </article>
        ))}
      </div>
    </div>
  );
}

function GuardrailGrid({ guardrails }: { guardrails: DataJourneyGuardrail[] }) {
  return (
    <div data-guardrails style={{ marginTop: 18 }}>
      <p style={{ ...labelStyle, margin: "0 0 10px" }}>Guardrail catalogue</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {guardrails.map((guardrail) => (
          <article
            key={guardrail.id}
            style={{
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: 8,
              padding: 14,
              background: "#FFFFFF",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: SHELL.INK }}>
              {guardrail.statement}
            </h3>
            <p
              style={{
                margin: "8px 0",
                color: SHELL.INK_SOFT,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {guardrail.reason}
            </p>
            <CompactMeta
              label="Enforced by"
              value={guardrail.enforcedBy.join(", ")}
            />
            <CompactMeta label="Status" value={guardrail.status} />
          </article>
        ))}
      </div>
    </div>
  );
}

function CompactMeta({ label, value }: { label: string; value: string }) {
  return (
    <p
      style={{
        margin: 0,
        display: "grid",
        gridTemplateColumns: "112px minmax(0, 1fr)",
        gap: 10,
        fontSize: 12,
        lineHeight: 1.45,
        color: SHELL.INK_SOFT,
      }}
    >
      <span
        style={{
          color: SHELL.INK_MUTED,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: 10,
        }}
      >
        {label}
      </span>
      <span>{value}</span>
    </p>
  );
}
