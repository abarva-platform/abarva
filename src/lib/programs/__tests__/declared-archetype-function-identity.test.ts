import fs from "node:fs";
import path from "node:path";

import { listEffectiveDiscoveryArchetypeOptions } from "@/lib/deliverables/orchestrator/briefs/archetype-declaration-surface";
import {
  FUNCTION_SPANNING_DECLARED_ARCHETYPE_IDS,
  mayGuessFunctionPackForDeclaredArchetype,
} from "@/lib/programs/declared-archetype-function-identity";
import { listFunctionPackCoverage } from "@/lib/programs/expert-kernel/domain/function-pack-registry";
import {
  FUNCTION_CLASSIFY_CONFIDENCE_FLOOR,
  classifyFunctionKey,
  industryKeyForCode,
} from "@/lib/programs/function-identity";

/**
 * The brief text origination actually concatenates for the classifier:
 * programName + problemStatement + targetOutcome + classification, blanks
 * dropped, space-joined (`deriveFunctionPackIdentity`).
 */
function originationBriefText(parts: string[]): string {
  return parts.filter((part) => part.trim().length > 0).join(" ");
}

/** A brief a governed-data-foundation Move legitimately carries. */
const GDF_BRIEF_HEALTHCARE = originationBriefText([
  "Governed Data Foundation for AI Readiness",
  "Our data is fragmented across service lines with no certified semantic layer, no lineage or audit trail, and data-quality rules that are undocumented. Master identity resolution is manual. We cannot certify any metric for AI use.",
  "A certified semantic layer, documented lineage, and a named data-governance council so AI use cases can be approved on governed data.",
  "governed_data_foundation",
]);

const GDF_BRIEF_PRIVACY_FORWARD = originationBriefText([
  "Enterprise Data Governance and Privacy Controls Foundation",
  "Privacy and security controls over patient and member data are inconsistent across source systems. Model risk and responsible-AI controls are not defined. Platform architecture readiness is unknown.",
  "Approved privacy, security and model-risk controls with a measurement owner and cadence.",
  "governed_data_foundation",
]);

describe("mayGuessFunctionPackForDeclaredArchetype", () => {
  it("lets an undeclared Move keep guessing — the legacy path is untouched", () => {
    expect(mayGuessFunctionPackForDeclaredArchetype(null)).toBe(true);
    expect(mayGuessFunctionPackForDeclaredArchetype(undefined)).toBe(true);
    expect(mayGuessFunctionPackForDeclaredArchetype("")).toBe(true);
  });

  it("declines the guess for a declared governed data foundation", () => {
    expect(
      mayGuessFunctionPackForDeclaredArchetype("governed_data_foundation"),
    ).toBe(false);
  });

  it("ignores surrounding whitespace in the declaration", () => {
    expect(
      mayGuessFunctionPackForDeclaredArchetype("  governed_data_foundation  "),
    ).toBe(false);
  });

  it("keeps guessing for every OTHER declarable archetype, named as literals", () => {
    // Written out, not mapped off the set under test: a rename of the suppressed
    // id must fail this suite rather than be read back as agreement.
    expect(
      mayGuessFunctionPackForDeclaredArchetype("ai_operations_customer_digital"),
    ).toBe(true);
    expect(
      mayGuessFunctionPackForDeclaredArchetype(
        "financial_services_commercial_lending_agent_assist",
      ),
    ).toBe(true);
    expect(mayGuessFunctionPackForDeclaredArchetype("general_default")).toBe(
      true,
    );
    expect(
      mayGuessFunctionPackForDeclaredArchetype(
        "healthcare_contact_center_agent_assist",
      ),
    ).toBe(true);
  });

  it("suppresses exactly one archetype id", () => {
    expect([...FUNCTION_SPANNING_DECLARED_ARCHETYPE_IDS]).toEqual([
      "governed_data_foundation",
    ]);
  });

  it("names only ids a person can actually declare", () => {
    const declarable = new Set(
      listEffectiveDiscoveryArchetypeOptions().map(
        (option) => option.blueprintId,
      ),
    );
    for (const id of FUNCTION_SPANNING_DECLARED_ARCHETYPE_IDS) {
      expect(declarable.has(id)).toBe(true);
    }
  });

  it("suppresses ids that are not themselves function-pack keys", () => {
    // If an archetype id ever WERE a pack key, suppression would be hiding a
    // real binding rather than declining a guess.
    const packKeys = new Set(
      listFunctionPackCoverage().map((entry) => String(entry.functionKey)),
    );
    for (const id of FUNCTION_SPANNING_DECLARED_ARCHETYPE_IDS) {
      expect(packKeys.has(id)).toBe(false);
    }
  });
});

describe("the mis-bind this guard exists to stop", () => {
  it("binds a CONTACT-CENTRE pack, confidently, for a healthcare governed-data-foundation brief", () => {
    const industryKey = industryKeyForCode("healthcare_idn");
    expect(industryKey).toBe("healthcare-provider");

    const guessed = classifyFunctionKey(industryKey!, GDF_BRIEF_HEALTHCARE);
    expect(guessed).not.toBeNull();
    expect(guessed!.functionKey).toBe("member_service_agent_assist");
    // Not a near-noise match the floor could have caught.
    expect(guessed!.confidence).toBeGreaterThan(
      FUNCTION_CLASSIFY_CONFIDENCE_FLOOR,
    );

    // The guard is what keeps that key out of `engagements.function_pack_key`.
    expect(
      mayGuessFunctionPackForDeclaredArchetype("governed_data_foundation"),
    ).toBe(false);
  });

  it("binds a risk pack for the same declaration in financial services", () => {
    const industryKey = industryKeyForCode("finserv");
    expect(industryKey).toBe("financial-services");

    const guessed = classifyFunctionKey(
      industryKey!,
      GDF_BRIEF_PRIVACY_FORWARD,
    );
    expect(guessed).not.toBeNull();
    expect(guessed!.functionKey).toBe("risk_management");
    expect(
      mayGuessFunctionPackForDeclaredArchetype("governed_data_foundation"),
    ).toBe(false);
  });

  it("still lets a contact-centre declaration bind its own pack", () => {
    // The branch that must keep winning: for an agent-assist archetype the
    // prose guess is plausibly RIGHT, so suppression must not reach it.
    const industryKey = industryKeyForCode("healthcare_idn");
    const guessed = classifyFunctionKey(industryKey!, GDF_BRIEF_HEALTHCARE);
    expect(guessed!.functionKey).toBe("member_service_agent_assist");
    expect(
      mayGuessFunctionPackForDeclaredArchetype(
        "healthcare_contact_center_agent_assist",
      ),
    ).toBe(true);
  });
});

describe("origination reads the guard before it guesses", () => {
  // `origination-submit.ts` is `server-only`; this file's sibling
  // `origination-submit-contract.test.ts` pins its behaviour the same way.
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(
      path.join(process.cwd(), "src/lib/programs/origination-submit.ts"),
      "utf8",
    );
  });

  it("imports the guard", () => {
    expect(source).toContain(
      'import { mayGuessFunctionPackForDeclaredArchetype } from "@/lib/programs/declared-archetype-function-identity";',
    );
  });

  it("returns no identity when the guard declines, before any classification", () => {
    expect(source).toContain(
      "if (!mayGuessFunctionPackForDeclaredArchetype(input.discoveryArchetypeId)) {\n    return null;\n  }",
    );
    const guardAt = source.indexOf(
      "if (!mayGuessFunctionPackForDeclaredArchetype(input.discoveryArchetypeId))",
    );
    const classifyAt = source.indexOf("classifyFunctionKey(industryKey,");
    expect(guardAt).toBeGreaterThan(-1);
    expect(classifyAt).toBeGreaterThan(guardAt);
  });

  it("reads the declaration AFTER it is normalized", () => {
    const normalizeAt = source.indexOf(
      "input.discoveryArchetypeId = normalizeDiscoveryArchetypeDeclaration(",
    );
    const charterBuildAt = source.indexOf("buildOriginationCharter(\n    input,");
    expect(normalizeAt).toBeGreaterThan(-1);
    expect(charterBuildAt).toBeGreaterThan(normalizeAt);
  });
});
