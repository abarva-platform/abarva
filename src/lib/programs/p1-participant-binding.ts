/** Current operational contacts are separate from signed historical roles. */
export interface P1ParticipantChoice {
  personId: string;
  name: string;
  role: string;
  attribution: "delegated_automated" | "declared_participant";
}

export interface P1ParticipantBindingPreview {
  moveId: string;
  status: "available" | "unavailable";
  reason?: string;
  current: { sponsorPersonId: string | null; leadPersonId: string | null };
  choices: P1ParticipantChoice[];
  revision: string;
  preservationRevision: string;
  canConfirm: boolean;
  confirmed: boolean;
  auditId: string | null;
}

export interface P1ParticipantBindingCommand {
  sponsorPersonId: string;
  leadPersonId: string;
  expectedRevision: string;
  requestId: string;
  rationale: string;
}

export class P1ParticipantBindingRefusal extends Error {
  constructor(
    public code: string,
    public detail: string,
    public status = 409,
  ) {
    super(detail);
  }
}

export function p1ParticipantBindingsReady(
  preview: P1ParticipantBindingPreview | null | undefined,
): boolean {
  return Boolean(
    preview?.status === "available" &&
    preview.confirmed &&
    preview.auditId &&
    preview.choices.some(
      (person) => person.personId === preview.current.sponsorPersonId,
    ) &&
    preview.choices.some(
      (person) => person.personId === preview.current.leadPersonId,
    ),
  );
}
