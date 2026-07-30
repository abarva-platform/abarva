"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/**
 * Leadership against evidence. Per the reconciliation's declared
 * SOURCE_INCOMPLETE allow-list, this resolves to SOURCE_INCOMPLETE for real
 * (non-fixture) airline-demo-new data -- the live interview corpus does not
 * yet support a complete leadership perspective set. Against the fixture
 * runtime this PR binds to, the fixture pack DOES carry two populated
 * (CIO/COO) perspectives, which resolve to DATA_RECONCILED_BUT_UI_UNPROVEN --
 * demonstrating the render mechanism works, distinct from the real tenant's
 * honest absence. The real LeadershipPerspectiveV1.evidenceStance carries
 * evidence REFS per stance (supporting/challenging/uncertain), not the
 * original prototype's free-text summaries -- refs are resolved to source
 * names via runtime.resolveEvidence for display.
 */
export function PerspectivesPanel() {
  const { assembler, runtime, tenantKey, lensId } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getLeadershipAgenda({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Leadership against evidence"
      emptyTitle="No leadership perspective published for this lens"
    >
      {({ perspectives }) => {
        if (perspectives.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No leadership perspective published for this lens yet.
            </p>
          );
        }
        return (
          <div className="space-y-3">
            {perspectives.map((p) => (
              <article
                key={p.id}
                className="rounded-md border border-[rgba(186,117,23,0.3)] bg-[rgba(186,117,23,0.06)] p-4"
              >
                <p className="text-sm italic text-[#2c2c2a]">
                  &ldquo;{p.quote}&rdquo;
                </p>
                <p className="mt-1 text-xs text-[#888780]">
                  {[p.attribution, p.role].filter(Boolean).join(" -- ")}
                </p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <StanceRow
                    label="Evidence supports"
                    refs={p.evidenceStance.supporting}
                    runtime={runtime}
                  />
                  <StanceRow
                    label="Evidence challenges"
                    refs={p.evidenceStance.challenging}
                    runtime={runtime}
                  />
                  <StanceRow
                    label="Still uncertain"
                    refs={p.evidenceStance.uncertain}
                    runtime={runtime}
                  />
                </dl>
              </article>
            ))}
          </div>
        );
      }}
    </GatedSection>
  );
}

function StanceRow({
  label,
  refs,
  runtime,
}: {
  readonly label: string;
  readonly refs: readonly string[];
  readonly runtime: ReturnType<typeof useKnowledgeApp>["runtime"];
}) {
  if (refs.length === 0) {
    return (
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-[#888780]">
          {label}
        </dt>
        <dd className="text-[#888780] italic">None recorded</dd>
      </div>
    );
  }
  const names = runtime
    .resolveEvidence([...refs])
    .map((e) => e.sourceName ?? "Not yet captured");
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#888780]">
        {label}
      </dt>
      <dd className="text-[#2c2c2a]">
        {names.length > 0 ? names.join(", ") : `${refs.length} item(s)`}
      </dd>
    </div>
  );
}
