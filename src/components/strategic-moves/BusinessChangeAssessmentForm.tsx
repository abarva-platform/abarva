"use client";

const ROUTE_IMPACT_CHOICES = ["none", "limited", "material"] as const;

function editableStructuredRecord(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch { return {}; }
}

export function BusinessChangeAssessmentForm({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const record = editableStructuredRecord(value);
  const update = (key: string, next: string) =>
    onChange(JSON.stringify({ ...record, [key]: next }));

  return (
    <div className="mxw-structured-form">
      <label>
        Expected workflow change
        <select
          aria-label="Expected workflow change"
          onChange={(event) =>
            update("expectedWorkflowChange", event.target.value)
          }
          value={
            typeof record.expectedWorkflowChange === "string"
              ? record.expectedWorkflowChange
              : ""
          }
        >
          <option value="">Select impact</option>
          {ROUTE_IMPACT_CHOICES.map((impact) => (
            <option key={impact} value={impact}>
              {impact}
            </option>
          ))}
        </select>
      </label>
      <label>
        Expected role / accountability change
        <select
          aria-label="Expected role or accountability change"
          onChange={(event) =>
            update("expectedRoleAccountabilityChange", event.target.value)
          }
          value={
            typeof record.expectedRoleAccountabilityChange === "string"
              ? record.expectedRoleAccountabilityChange
              : ""
          }
        >
          <option value="">Select impact</option>
          {ROUTE_IMPACT_CHOICES.map((impact) => (
            <option key={impact} value={impact}>
              {impact}
            </option>
          ))}
        </select>
      </label>
      <label>
        Adoption owner role
        <input
          aria-label="Adoption owner role"
          onChange={(event) => update("adoptionOwner", event.target.value)}
          placeholder="Accountable business role"
          value={
            typeof record.adoptionOwner === "string" ? record.adoptionOwner : ""
          }
        />
      </label>
      <label>
        Adoption responsibility
        <select
          aria-label="Adoption responsibility"
          onChange={(event) =>
            update("adoptionResponsibility", event.target.value)
          }
          value={
            typeof record.adoptionResponsibility === "string"
              ? record.adoptionResponsibility
              : ""
          }
        >
          <option value="">Select owner</option>
          <option value="business">Business</option>
          <option value="delivery_team">Delivery team</option>
          <option value="shared">Shared</option>
        </select>
      </label>
      <label>
        Evidence reference for this hypothesis
        <input
          aria-label="Evidence reference for the business change hypothesis"
          onChange={(event) => update("evidenceReference", event.target.value)}
          placeholder="Interview, uploaded file, or source record"
          value={
            typeof record.evidenceReference === "string"
              ? record.evidenceReference
              : ""
          }
        />
      </label>
      <label>
        Sponsor / validator role
        <input
          aria-label="Sponsor or validator role"
          onChange={(event) => update("validatedBy", event.target.value)}
          placeholder="Accountable role"
          value={
            typeof record.validatedBy === "string" ? record.validatedBy : ""
          }
        />
      </label>
      <p className="mxw-structured-note">
        P1 records the hypothesis and adoption owner. P2 must validate or
        correct it against current-state evidence before P3 depth changes.
      </p>
    </div>
  );
}
