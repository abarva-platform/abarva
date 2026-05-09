export interface AtlasCitation {
  initiativeId?: string;
  vendorId?: string;
  kpiId?: string;
  field: string;
  value: string | number;
}

export interface AtlasCitedObservation {
  body: string;
  citations: ReadonlyArray<AtlasCitation>;
}

const ALLOWED_FIELD_PREFIXES = [
  'ai_initiatives.',
  'ai_initiative_vendors.',
  'ai_initiative_kpis.',
  'ai_initiative_decisions.',
  'ai_initiative_scenarios.',
  'ai_initiative_stakeholder_notes.',
  'tower_view.',
];

export function validateAtlasCitationList(
  citations: ReadonlyArray<AtlasCitation>,
): ReadonlyArray<string> {
  const errors: string[] = [];
  citations.forEach((citation, index) => {
    if (!ALLOWED_FIELD_PREFIXES.some((prefix) => citation.field.startsWith(prefix))) {
      errors.push(`citation${index + 1}: unknown citation field ${citation.field}`);
    }
    if (citation.value === '') {
      errors.push(`citation${index + 1}: empty citation value for ${citation.field}`);
    }
  });
  return errors;
}

const NUMBER_PATTERN = /(?<![A-Za-z-])(?:\$)?\d+(?:\.\d+)?(?:%|M|K|d| days?)?/g;

function compactNumberVariants(value: string | number): ReadonlyArray<string> {
  if (typeof value !== 'number' || !Number.isFinite(value)) return [String(value)];
  const variants = [String(value)];
  if (value >= 1_000_000) variants.push(`$${(value / 1_000_000).toFixed(1)}M`, `${(value / 1_000_000).toFixed(1)}`);
  if (value >= 1_000) variants.push(`$${(value / 1_000).toFixed(0)}K`, `${(value / 1_000).toFixed(0)}`);
  return variants;
}

export function validateAtlasCitations(
  observations: ReadonlyArray<AtlasCitedObservation>,
): ReadonlyArray<string> {
  const errors: string[] = [];

  observations.forEach((observation, index) => {
    if (observation.citations.length === 0) {
      errors.push(`obs${index + 1}: missing citations`);
      return;
    }

    for (const citation of observation.citations) {
      if (!ALLOWED_FIELD_PREFIXES.some((prefix) => citation.field.startsWith(prefix))) {
        errors.push(`obs${index + 1}: unknown citation field ${citation.field}`);
      }
      if (citation.value === '') {
        errors.push(`obs${index + 1}: empty citation value for ${citation.field}`);
      }
    }

    const numericClaims = observation.body.match(NUMBER_PATTERN) ?? [];
    const citedValues = new Set(
      observation.citations.flatMap((citation) => compactNumberVariants(citation.value)),
    );
    for (const claim of numericClaims) {
      const normalized = claim.replace(/^\$/, '').replace(/\s+days?$/, '').replace(/[MKd%]$/, '');
      const hasCitation = [...citedValues].some((value) => {
        const text = String(value);
        return text === claim || text === normalized || claim.includes(text) || text.includes(normalized);
      });
      if (!hasCitation) {
        errors.push(`obs${index + 1}: uncited numeric claim ${claim}`);
      }
    }
  });

  return errors;
}
