import "server-only";

import { loadHomeLandscape, type HomeLandscapeDimension } from "@/lib/home/landscape-read-adapter";
import {
  ENTERPRISE_LANDSCAPE_NAV,
  type LandscapeSection,
  type LandscapeTableRow,
  type LandscapeTone,
} from "@/lib/home/enterprise-landscape-view-model";

/**
 * Intelligence advisory sections, built from the canonical landscape.
 *
 * What was here before was not a read path. `enterprise-landscape-view-model.ts` is 661 lines with
 * no database call in it: one tenant got hand-authored sections naming specific platforms and
 * carrying specific maturity scores, and every other tenant got `buildGenericSections`, which emits
 * sentences like "the section is ready for client-specific evidence" formatted to look exactly like
 * an assessment. Both render under the heading CURRENT STATE ASSESSMENT. Neither reads a single
 * client fact.
 *
 * That is the failure mode worth naming: not an empty screen, which announces itself, but a full
 * one whose content came from a file someone wrote rather than from the client's data. A reader
 * cannot tell those apart by looking.
 *
 * So every row this module produces carries where it came from, and a section with no canonical
 * data says so in place of prose. An empty section is a finding — it says the client has not
 * supplied that part of their estate — and it is worth more than a paragraph that reads like an
 * answer and is not one.
 */

/** A dimension is worth naming when it has instances; `directional` still counts, `not_available` does not. */
function hasData(d: HomeLandscapeDimension): boolean {
  return d.recordCount > 0;
}

function toneFor(d: HomeLandscapeDimension): LandscapeTone {
  if (d.confidenceStatus === "not_available") return "red";
  return d.confidenceStatus === "evidenced" ? "teal" : "amber";
}

function tagFor(d: HomeLandscapeDimension): string {
  if (d.confidenceStatus === "not_available") return "NOT SUPPLIED";
  return d.confidenceStatus === "evidenced" ? "EVIDENCED" : "DIRECTIONAL";
}

/**
 * One row per dimension: the count, the named examples, and how well evidenced it is.
 *
 * `distinctNameCount` is reported separately from `recordCount` because they differ, often by a
 * lot, and the difference is meaningful. 825 relationship rows naming 300 distinct systems is a
 * densely connected estate; reporting it as "825 systems" would be wrong by a factor of nearly
 * three, and it is exactly the kind of inflation that survives review because the number came from
 * a real table.
 */
function rowForDimension(d: HomeLandscapeDimension): LandscapeTableRow {
  if (!hasData(d)) {
    return {
      area: d.displayName,
      assessment: "No records supplied for this dimension in the current intake, so there is nothing to assess here yet.",
      tag: "NOT SUPPLIED",
      tone: "red",
    };
  }
  const examples = d.sampleEntities.length > 0 ? ` For example: ${d.sampleEntities.slice(0, 5).join(", ")}.` : "";
  const distinct =
    d.distinctNameCount > 0 && d.distinctNameCount !== d.recordCount
      ? ` ${d.recordCount.toLocaleString()} records naming ${d.distinctNameCount.toLocaleString()} distinct entities.`
      : ` ${d.recordCount.toLocaleString()} records.`;
  const evidence =
    d.evidenceCount > 0
      ? ` Carries ${d.evidenceCount.toLocaleString()} evidence references back to the source files.`
      : " Declared by the client with no supporting evidence reference attached.";
  return {
    area: d.displayName,
    assessment: `${distinct.trim()}${evidence}${examples}`,
    tag: tagFor(d),
    tone: toneFor(d),
  };
}

/**
 * Build the advisory sections for a tenant from its canonical landscape.
 *
 * Returns null when the projector has not run, which is a different state from "the client supplied
 * nothing" and must not be shown as if it were.
 */
export async function buildCanonicalLandscapeSections(
  tenantKey: string | null | undefined,
  tenantName: string,
): Promise<{
  sections: Record<string, LandscapeSection>;
  buildVersion: string;
  generatedAt: string | null;
} | null> {
  const landscape = await loadHomeLandscape(tenantKey);
  if (!landscape) return null;

  const assembled = landscape.generatedAt
    ? new Date(landscape.generatedAt).toISOString().slice(0, 10)
    : "unknown";
  const meta: LandscapeSection["meta"] = [
    { label: "TENANT", value: tenantName.toUpperCase() },
    { label: "ASSEMBLED", value: assembled },
    { label: "BUILD", value: landscape.buildVersion },
  ];

  const sections: Record<string, LandscapeSection> = {};

  for (const group of ENTERPRISE_LANDSCAPE_NAV) {
    for (const nav of group.sections) {
      const dims = landscape.dimensions.filter((d) => d.section === nav.id);
      const present = dims.filter(hasData);
      const entities = present.reduce((n, d) => n + d.recordCount, 0);
      const evidence = present.reduce((n, d) => n + d.evidenceCount, 0);

      // A section nothing projects into is different from a section whose dimensions came back
      // empty. The first means the model has no facts of this kind at all; the second means this
      // client did not supply them. Saying "not supplied" for the first would blame the client for
      // a gap in our own model.
      const summary =
        dims.length === 0
          ? `No canonical dimension currently projects into ${nav.label.toLowerCase()}. This is a gap in the model, not in the client's intake.`
          : present.length === 0
            ? `${tenantName} has supplied no records for ${nav.label.toLowerCase()}. Every dimension behind this section is empty in the current intake.`
            : `${entities.toLocaleString()} canonical records across ${present.length} of ${dims.length} dimensions, carrying ${evidence.toLocaleString()} evidence references.`;

      sections[nav.id] = {
        id: nav.id,
        eyebrow: `CURRENT STATE — ${nav.label.toUpperCase()}`,
        title: nav.label,
        subtitle: `${tenantName} · projected from the canonical model, build ${landscape.buildVersion}`,
        meta,
        executiveSummary: summary,
        currentState:
          dims.length === 0
            ? [
                {
                  area: nav.label,
                  assessment:
                    "Nothing in the canonical model answers this question yet. Adding it is a change to the dimension registry, not to this page.",
                  tag: "NO DIMENSION",
                  tone: "red",
                },
              ]
            : dims.map(rowForDimension),
        implications: present.map((d) => ({
          label: d.displayName,
          value:
            d.evidenceCount > 0
              ? `${d.distinctNameCount.toLocaleString()} named, evidenced`
              : `${d.distinctNameCount.toLocaleString()} named, declared only`,
          risk: d.evidenceCount === 0,
        })),
        // Maturity is a judgement, and nothing in the canonical model scores it. Rather than invent
        // a score from record counts — which would read as an assessment and measure only how much
        // the client typed — this reports evidence coverage, which is a fact.
        maturity: present.map((d) => ({
          label: `${d.displayName} — evidence coverage`,
          score: d.recordCount === 0 ? 0 : Math.min(5, Math.round((d.evidenceCount / d.recordCount) * 5)),
          tone: toneFor(d),
        })),
        exhibits: [],
        leadershipRead:
          present.length === 0
            ? "There is nothing to read here until this part of the estate is supplied."
            : `Every figure on this page traces to canonical build ${landscape.buildVersion}. Counts are records, not judgements; where a dimension is declared only, the client asserted it and no source file backs it.`,
        snapshot: present.map((d) => [d.displayName, d.recordCount.toLocaleString()] as const),
        sources: present.map((d) => ({
          title: d.objectType ?? d.dimensionKey,
          detail: `${d.recordCount.toLocaleString()} canonical records · ${d.evidenceCount.toLocaleString()} evidence references · ${d.confidenceStatus}`,
        })),
      };
    }
  }

  return { sections, buildVersion: landscape.buildVersion, generatedAt: landscape.generatedAt };
}
