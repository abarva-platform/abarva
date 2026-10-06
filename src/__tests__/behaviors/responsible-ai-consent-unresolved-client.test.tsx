/**
 * @jest-environment jsdom
 */

/**
 * U-513 · the two Responsible AI consent surfaces must not name an account the
 * request never resolved.
 *
 * Both pages compute their `clientName` as
 *
 * ```ts
 * foundationClientDisplayName(subject?.clientKey) ??
 *   canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
 *   activeClient?.name ??
 *   "your workspace";
 * ```
 *
 * `canonicalClientDisplayName` ends by resolving anything it does not recognise
 * through `getClientOption`, which answers the DEFAULT_CLIENT_KEY option rather
 * than `undefined`, so it never returns `null` and the two tails behind it are
 * unreachable. The classification of all 40 such call sites is
 * `docs/governance/unresolved-client-fallback-classification.md`; U-512 named
 * these two as guard class with the repair owed, because proving them needs a
 * harness that reaches past the redirects each page performs first.
 *
 * These two are guards rather than chrome because of where the name lands. The
 * acknowledgment form renders "I accept it for my access to {clientName}." and
 * the training form renders "Required training for {clientName}" -- a consent
 * record is being taken against the account named. Naming the default account
 * to a reader whose tenant did not resolve records their acceptance against a
 * tenancy the request never established.
 *
 * Both forms are rendered for real rather than stubbed, because the defect was
 * never visible in the call site -- only in the sentence that reached the
 * reader.
 */
import { render, screen } from "@testing-library/react";

jest.mock("server-only", () => ({}));

import {
  DEFAULT_CLIENT_KEY,
  getClientOption,
} from "@/lib/client-config";

/** What both surfaces name today when nothing resolves. */
const DEFAULT_ACCOUNT_NAME = getClientOption(DEFAULT_CLIENT_KEY).name;

/** A key that reads successfully and resolves to no registered client. */
const UNREGISTERED_KEY = "not-a-registered-tenant";

// ---------------------------------------------------------------------------
// Module boundary
// ---------------------------------------------------------------------------

const redirect = jest.fn((target: string) => {
  throw new Error(`REDIRECTED:${target}`);
});
const routerPush = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (target: string) => redirect(target),
  // Both forms are client components that call `useRouter` on mount. They are
  // rendered for real here, so the hook has to answer.
  useRouter: () => ({ push: routerPush, replace: routerPush, refresh: jest.fn() }),
}));

const getActiveClientRow = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRow(...args),
}));

const getResponsibleAiAcknowledgmentSubjectForRequest = jest.fn();
const getResponsibleAiAcknowledgmentStatus = jest.fn();
jest.mock("@/lib/ai-liability/responsible-ai-acknowledgment", () => ({
  RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE: "/responsible-ai/acknowledgment",
  getResponsibleAiAcknowledgmentSubjectForRequest: () =>
    getResponsibleAiAcknowledgmentSubjectForRequest(),
  getResponsibleAiAcknowledgmentStatus: (...args: unknown[]) =>
    getResponsibleAiAcknowledgmentStatus(...args),
}));

const getResponsibleAiTrainingStatus = jest.fn();
jest.mock("@/lib/ai-liability/responsible-ai-training", () => ({
  AIRLINE_FOUNDATION_TRAINING_COMPLETION_STATEMENT: "completion statement",
  AIRLINE_FOUNDATION_TRAINING_MODULES: [],
  getResponsibleAiTrainingStatus: (...args: unknown[]) =>
    getResponsibleAiTrainingStatus(...args),
}));

import ResponsibleAiAcknowledgmentPage from "@/app/(public)/responsible-ai/acknowledgment/page";
import ResponsibleAiTrainingPage from "@/app/(public)/responsible-ai/training/page";

/**
 * A subject whose own `clientKey` resolves to no foundation client, so the
 * chain falls through to the `canonicalClientDisplayName` link under test.
 */
const SUBJECT = {
  clientKey: UNREGISTERED_KEY,
  personId: "person-1",
  email: "reader@example.com",
};

const ACKNOWLEDGMENT_REQUIRED = {
  required: true,
  textVersion: "v1",
  consentText: "consent text",
  storageAvailable: true,
  acceptedAt: null,
  expiresAt: null,
  reacknowledgmentIntervalDays: 365,
  reason: null,
};

const TRAINING_REQUIRED = {
  required: true,
  trainingVersion: "v1",
  completionStatement: "I completed the training.",
  estimatedMinutes: 10,
  storageAvailable: true,
  completedAt: null,
  reason: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  getResponsibleAiAcknowledgmentSubjectForRequest.mockResolvedValue(SUBJECT);
});

// ---------------------------------------------------------------------------
// 1 · /responsible-ai/acknowledgment
// ---------------------------------------------------------------------------

describe("Responsible AI acknowledgment · consent surface", () => {
  beforeEach(() => {
    getResponsibleAiAcknowledgmentStatus.mockResolvedValue(
      ACKNOWLEDGMENT_REQUIRED,
    );
  });

  /** The sentence the reader accepts, read out of the rendered page. */
  function consentSentence(): string {
    return screen.getByText(/access to/i).textContent ?? "";
  }

  it("names no account when the client row carries an unregistered key", async () => {
    getActiveClientRow.mockResolvedValue({ key: UNREGISTERED_KEY });

    render(await ResponsibleAiAcknowledgmentPage());

    expect(redirect).not.toHaveBeenCalled();
    expect(consentSentence()).toContain("your workspace");
    expect(consentSentence()).not.toContain(DEFAULT_ACCOUNT_NAME);
  });

  it("names no account when the client row cannot be read at all", async () => {
    getActiveClientRow.mockRejectedValue(new Error("tenant read failed"));

    render(await ResponsibleAiAcknowledgmentPage());

    expect(consentSentence()).toContain("your workspace");
    expect(consentSentence()).not.toContain(DEFAULT_ACCOUNT_NAME);
  });

  it("names no account when the row carries a blank name, which is not nullish", async () => {
    // Once the canonical link can answer `null`, the row's own name is reached,
    // and `"   ".trim()` is `""` -- not nullish, so `??` alone would render the
    // consent sentence with no account at all rather than the neutral literal.
    getActiveClientRow.mockResolvedValue({ key: UNREGISTERED_KEY, name: "   " });

    render(await ResponsibleAiAcknowledgmentPage());

    expect(consentSentence()).toContain("your workspace");
  });

  it("still names a registered client, so the repair is not a blanket mute", async () => {
    getActiveClientRow.mockResolvedValue({
      key: "meridian",
      name: "Meridian Health",
    });

    render(await ResponsibleAiAcknowledgmentPage());

    expect(consentSentence()).toContain("Meridian Health");
  });

  it("names the row's own name when it is present but not a registered client", async () => {
    // The author's third link, live for the first time: the row came from the
    // tenant read, so its own name is the request's established tenancy even
    // when it is not in the registered client list.
    getActiveClientRow.mockResolvedValue({
      key: UNREGISTERED_KEY,
      name: "A Tenant Not In The Register",
    });

    render(await ResponsibleAiAcknowledgmentPage());

    expect(consentSentence()).toContain("A Tenant Not In The Register");
    expect(consentSentence()).not.toContain(DEFAULT_ACCOUNT_NAME);
  });

  it("still names a foundation client from the subject's own key", async () => {
    getResponsibleAiAcknowledgmentSubjectForRequest.mockResolvedValue({
      ...SUBJECT,
      clientKey: "airline-demo-new",
    });
    getActiveClientRow.mockResolvedValue(null);

    render(await ResponsibleAiAcknowledgmentPage());

    expect(consentSentence()).toContain("Airline Demo New");
  });
});

// ---------------------------------------------------------------------------
// 2 · /responsible-ai/training
// ---------------------------------------------------------------------------

describe("Responsible AI training · consent surface", () => {
  beforeEach(() => {
    // The training page redirects to acknowledgment unless that is already
    // satisfied, then to /home unless training is still required. Both have to
    // be stepped past before the name is computed at all.
    getResponsibleAiAcknowledgmentStatus.mockResolvedValue({
      required: false,
      storageAvailable: true,
    });
    getResponsibleAiTrainingStatus.mockResolvedValue(TRAINING_REQUIRED);
  });

  /** The line that names the account the training is required for. */
  function requirementLine(): string {
    return screen.getByText(/Required training for/i).textContent ?? "";
  }

  it("names no account when the client row carries an unregistered key", async () => {
    getActiveClientRow.mockResolvedValue({ key: UNREGISTERED_KEY });

    render(await ResponsibleAiTrainingPage());

    expect(redirect).not.toHaveBeenCalled();
    expect(requirementLine()).toContain("your workspace");
    expect(requirementLine()).not.toContain(DEFAULT_ACCOUNT_NAME);
  });

  it("names no account when the client row cannot be read at all", async () => {
    getActiveClientRow.mockRejectedValue(new Error("tenant read failed"));

    render(await ResponsibleAiTrainingPage());

    expect(requirementLine()).toContain("your workspace");
    expect(requirementLine()).not.toContain(DEFAULT_ACCOUNT_NAME);
  });

  it("still names a registered client", async () => {
    getActiveClientRow.mockResolvedValue({
      key: "meridian",
      name: "Meridian Health",
    });

    render(await ResponsibleAiTrainingPage());

    expect(requirementLine()).toContain("Meridian Health");
  });
});
