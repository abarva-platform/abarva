/**
 * "Accepted" is one decision, read in four places.
 *
 * A source file's accepted state is written by the load that loaded it. It is acceptance only when
 * an approval is recorded beside it. The page, the advisor's refusal, the export and the gate that
 * decides whether a narrative reads as aligned with the record all have to agree on that, so they
 * are held here against the same files rather than each in its own suite.
 */
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { azureRead } from "@/lib/data-plane/azureRead";
import { renderHomeWalkthroughHtml } from "@/lib/home/export/walkthrough-export";

import { answerHomeAvaQuestion } from "../ava-answer";
import {
  buildHomeReviewBundleFromEclProjectionRows,
  getHomeEclProjectionBundle,
  isHomeSourceFileAccepted,
  type HomeProjectionRow,
  type HomeSourceFileReviewRow,
} from "../ecl-projection-bundle";
import {
  HOME_PREVIEW_TENANT_KEYS,
  getHomeReviewBundle,
} from "../golden-snapshot";
import {
  homeSourceFileReviewLabel,
  homeSourceFileReviewLabelForVersion,
} from "../record-source";
import type {
  HomeContextVersion,
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "../types";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));
jest.mock("../home-assessment-selection", () => ({
  selectHomeAssessment: jest.fn(async () => ({
    assessmentId: "assessment-under-test",
    declared: null,
  })),
}));

const TENANT_KEY = HOME_PREVIEW_TENANT_KEYS[0];

const APPROVAL = {
  approved_by: "A named approver",
  approved_at: "2026-10-01",
  release_record: "docs/releases/records/example-load-approval.md",
};

function file(
  index: number,
  quality_state: string,
  load_approval?: unknown,
): HomeSourceFileReviewRow {
  return {
    id: `source-file-${String(index).padStart(3, "0")}`,
    file_name: `family-${index}.csv`,
    file_hash: "a".repeat(64),
    source_date: "2026-09-30",
    quality_state,
    load_approval,
  };
}

function files(
  count: number,
  quality_state: string,
  load_approval?: unknown,
  from = 0,
): HomeSourceFileReviewRow[] {
  return Array.from({ length: count }, (_unused, index) =>
    file(from + index, quality_state, load_approval),
  );
}

const ROW: HomeProjectionRow = {
  page_key: "applications_systems",
  row_key: "APP-1",
  row_type: "application",
  title: "One application",
  summary: null,
  display_payload_json: {},
  projection_entry_id: "projection-entry-1",
  source_hash: "row-hash",
  source_refs_json: [{ source_record_id: "source-row-1" }],
  admission_status: "admitted",
};
const LINKS = new Map([
  ["projection-entry-1", new Map([["row-hash", new Set(["source-row-1"])]])],
]);

function served(catalog: HomeSourceFileReviewRow[]): {
  bundle: HomeReviewBundle;
  version: HomeContextVersion;
  source: HomeRecordRenderSource;
} {
  const base = getHomeReviewBundle(TENANT_KEY);
  if (!base) throw new Error("stored copy missing");
  const bundle = buildHomeReviewBundleFromEclProjectionRows(
    base,
    [ROW],
    undefined,
    LINKS,
    catalog,
  );
  if (!bundle.contextVersion) throw new Error("context version missing");
  return {
    bundle,
    version: bundle.contextVersion,
    source: {
      kind: "ecl_serving_projection",
      canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
      contextVersion: bundle.contextVersion,
    },
  };
}

const ACCEPTED_WITHOUT_APPROVAL =
  "Source-file quality: 0 of 22 accepted; 22 not reviewed";
const ACCEPTED_WITH_APPROVAL = "Source-file quality: 22 of 22 accepted";

afterEach(() => {
  jest.restoreAllMocks();
  jest.mocked(getAuditedAnthropicClient).mockReset();
});

describe("what counts as an accepted source file", () => {
  it("needs the accepted state and a recorded approval, both", () => {
    expect(isHomeSourceFileAccepted(file(1, "accepted", APPROVAL))).toBe(true);
    // The same approval as text: some drivers hand a JSON column back unparsed.
    expect(
      isHomeSourceFileAccepted(file(1, "accepted", JSON.stringify(APPROVAL))),
    ).toBe(true);

    const notAnApproval: unknown[] = [
      undefined,
      null,
      "",
      "not json",
      [],
      [APPROVAL],
      {},
      { approved_by: APPROVAL.approved_by },
      { ...APPROVAL, approved_by: "   " },
      { ...APPROVAL, approved_at: "" },
      { ...APPROVAL, release_record: undefined },
      { ...APPROVAL, approved_by: 7 },
    ];
    for (const load_approval of notAnApproval) {
      expect(isHomeSourceFileAccepted(file(1, "accepted", load_approval))).toBe(
        false,
      );
    }
    // An approval does not turn another state into acceptance.
    for (const state of ["partial", "blocked", "superseded", ""]) {
      expect(isHomeSourceFileAccepted(file(1, state, APPROVAL))).toBe(false);
    }
  });
});

describe("the source-file statement", () => {
  it("says accepted only for files whose load carries a recorded approval", () => {
    const approved = served(files(22, "accepted", APPROVAL));
    expect(approved.version.sourceFileReview).toEqual({
      totalFiles: 22,
      acceptedFiles: 22,
      notReviewedFiles: 0,
      partialFiles: 0,
      blockedFiles: 0,
      supersededFiles: 0,
    });
    expect(homeSourceFileReviewLabel(approved.source)).toBe(
      ACCEPTED_WITH_APPROVAL,
    );

    const stateOnly = served(files(22, "accepted"));
    expect(stateOnly.version.sourceFileReview).toEqual({
      totalFiles: 22,
      acceptedFiles: 0,
      notReviewedFiles: 22,
      partialFiles: 0,
      blockedFiles: 0,
      supersededFiles: 0,
    });
    expect(homeSourceFileReviewLabel(stateOnly.source)).toBe(
      ACCEPTED_WITHOUT_APPROVAL,
    );
  });

  it("counts each state once when a record mixes them", () => {
    const mixed = served([
      ...files(10, "accepted", APPROVAL, 0),
      ...files(8, "accepted", undefined, 10),
      ...files(2, "partial", undefined, 18),
      ...files(1, "blocked", APPROVAL, 20),
      ...files(1, "superseded", undefined, 21),
    ]);
    const review = mixed.version.sourceFileReview;
    expect(review).toEqual({
      totalFiles: 22,
      acceptedFiles: 10,
      notReviewedFiles: 8,
      partialFiles: 2,
      blockedFiles: 1,
      supersededFiles: 1,
    });
    expect(
      (review?.acceptedFiles ?? 0) +
        (review?.notReviewedFiles ?? 0) +
        (review?.partialFiles ?? 0) +
        (review?.blockedFiles ?? 0) +
        (review?.supersededFiles ?? 0),
    ).toBe(review?.totalFiles);
    expect(homeSourceFileReviewLabel(mixed.source)).toBe(
      "Source-file quality: 10 of 22 accepted; 8 not reviewed; 2 partial; 1 blocked; 1 superseded",
    );
  });

  it("reads exactly as before for partial, blocked and superseded files", () => {
    expect(homeSourceFileReviewLabel(served(files(14, "partial")).source)).toBe(
      "Source-file quality: 0 of 14 accepted; 14 partial",
    );
    expect(
      homeSourceFileReviewLabel(
        served([
          ...files(3, "accepted", APPROVAL, 0),
          ...files(2, "blocked", undefined, 3),
          ...files(1, "superseded", undefined, 5),
        ]).source,
      ),
    ).toBe("Source-file quality: 3 of 6 accepted; 2 blocked; 1 superseded");
    // A version recorded before the not-reviewed count existed still reads.
    expect(
      homeSourceFileReviewLabelForVersion({
        sourceFileReview: {
          totalFiles: 14,
          acceptedFiles: 0,
          partialFiles: 14,
          blockedFiles: 0,
          supersededFiles: 0,
        },
      } as HomeContextVersion),
    ).toBe("Source-file quality: 0 of 14 accepted; 14 partial");
    expect(homeSourceFileReviewLabel(served([]).source)).toBe(
      "No source files registered for this record",
    );
  });

  it("is the statement the advisor gives when it declines to answer", async () => {
    for (const [catalog, statement] of [
      [files(22, "accepted"), ACCEPTED_WITHOUT_APPROVAL],
      [files(22, "accepted", APPROVAL), ACCEPTED_WITH_APPROVAL],
    ] as const) {
      const { bundle } = served(catalog);
      expect(bundle.contextVersion?.coherence).not.toBe("coherent");
      const answer = await answerHomeAvaQuestion({
        bundle,
        tenantKey: TENANT_KEY,
        question: "Which source files have been accepted?",
      });
      expect(answer.status).toBe("no_data");
      expect(answer.directAnswer).toContain(`${statement}.`);
    }
    expect(getAuditedAnthropicClient).not.toHaveBeenCalled();
  });

  it("is the statement the export prints", () => {
    for (const [catalog, statement, absent] of [
      [
        files(22, "accepted"),
        ACCEPTED_WITHOUT_APPROVAL,
        ACCEPTED_WITH_APPROVAL,
      ],
      [files(22, "accepted", APPROVAL), ACCEPTED_WITH_APPROVAL, "not reviewed"],
    ] as const) {
      const { bundle, source } = served(catalog);
      const html = renderHomeWalkthroughHtml({
        bundle,
        recordSource: source,
        tenantLabel: "Tenant under test",
        format: "html",
      });
      expect(html).toContain(statement);
      expect(html).not.toContain(absent);
    }
  });
});

describe("the catalog read", () => {
  it("carries each file's recorded approval from the file row to the statement", async () => {
    const query = jest
      .spyOn(azureRead, "query")
      .mockResolvedValueOnce([
        { full_name: "serving.home_applications_systems" },
      ])
      .mockResolvedValueOnce([ROW])
      .mockResolvedValueOnce([
        {
          projection_entry_id: "projection-entry-1",
          source_record_id: "source-row-1",
          source_hash: "row-hash",
        },
      ])
      .mockResolvedValueOnce([
        file(1, "accepted", APPROVAL),
        file(2, "accepted", null),
        file(3, "accepted"),
      ]);
    jest.spyOn(console, "warn").mockImplementation(() => {});

    const bundle = await getHomeEclProjectionBundle(TENANT_KEY);

    const catalogSql = String(query.mock.calls[3]?.[0]);
    expect(catalogSql).toContain("ecl_source.source_file");
    expect(catalogSql).toContain(
      "metadata_json->'load_approval' as load_approval",
    );
    expect(bundle.contextVersion?.sourceFileReview).toEqual({
      totalFiles: 3,
      acceptedFiles: 1,
      notReviewedFiles: 2,
      partialFiles: 0,
      blockedFiles: 0,
      supersededFiles: 0,
    });
    expect(homeSourceFileReviewLabelForVersion(bundle.contextVersion)).toBe(
      "Source-file quality: 1 of 3 accepted; 2 not reviewed",
    );
    // Who approved is read to decide the count. It is not part of what the page is handed.
    expect(JSON.stringify(bundle)).not.toContain(APPROVAL.approved_by);
  });
});
