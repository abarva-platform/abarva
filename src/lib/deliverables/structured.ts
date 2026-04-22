interface TemplateSectionDefinition {
  key: string;
  title: string;
  required: boolean;
}

export interface StructuredDeliverableSection {
  key: string;
  title: string;
  required: boolean;
  body: string;
  citations: string[];
}

export interface StructuredDeliverableData {
  schema_version: 1;
  deliverable_type_key: string;
  title: string;
  section_order: string[];
  sections: StructuredDeliverableSection[];
  evidence_refs: string[];
  missing_required_sections: string[];
  markdown: string;
}

function normalizeHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/\+/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractTurnReferences(value: string): string[] {
  const matches = value.match(/\[turn\s+\d+\]/gi) ?? [];
  return Array.from(new Set(matches.map((match) => match.toLowerCase())));
}

export function getTemplateSections(templateStructure: Record<string, unknown> | null | undefined): TemplateSectionDefinition[] {
  const rawSections = (templateStructure?.sections as Array<Record<string, unknown>> | undefined) ?? [];
  return rawSections.map((section, index) => ({
    key: typeof section.key === 'string' ? section.key : `section_${index + 1}`,
    title: typeof section.title === 'string' ? section.title : typeof section.key === 'string' ? section.key : `Section ${index + 1}`,
    required: section.required !== false,
  }));
}

export function buildStructuredDeliverableData(args: {
  content: string;
  deliverableTypeKey: string;
  title: string;
  templateStructure: Record<string, unknown> | null | undefined;
}): StructuredDeliverableData {
  const templateSections = getTemplateSections(args.templateStructure);
  const byHeading = new Map<string, TemplateSectionDefinition>();
  const byKey = new Map<string, TemplateSectionDefinition>();

  for (const section of templateSections) {
    byHeading.set(normalizeHeading(section.title), section);
    byKey.set(normalizeHeading(section.key), section);
  }

  const lines = args.content.replace(/\r\n/g, '\n').split('\n');
  const headingMatches: Array<{ line: number; section: TemplateSectionDefinition }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? '';
    const markdownHeading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (!markdownHeading) continue;
    const headingText = normalizeHeading(markdownHeading[1] ?? '');
    const matched = byHeading.get(headingText) ?? byKey.get(headingText);
    if (matched) {
      headingMatches.push({ line: index, section: matched });
    }
  }

  const parsedBodies = new Map<string, string>();
  for (let index = 0; index < headingMatches.length; index += 1) {
    const current = headingMatches[index];
    const next = headingMatches[index + 1];
    const bodyStart = current.line + 1;
    const bodyEnd = next ? next.line : lines.length;
    const body = lines.slice(bodyStart, bodyEnd).join('\n').trim();
    parsedBodies.set(current.section.key, body);
  }

  const sections = templateSections.map((section) => {
    const body = parsedBodies.get(section.key)?.trim() ?? '';
    return {
      key: section.key,
      title: section.title,
      required: section.required,
      body,
      citations: extractTurnReferences(body),
    };
  });

  const evidenceRefs = Array.from(
    new Set(sections.flatMap((section) => section.citations)),
  );

  const missingRequiredSections = sections
    .filter((section) => section.required && section.body.length === 0)
    .map((section) => section.key);

  return {
    schema_version: 1,
    deliverable_type_key: args.deliverableTypeKey,
    title: args.title,
    section_order: sections.map((section) => section.key),
    sections,
    evidence_refs: evidenceRefs,
    missing_required_sections: missingRequiredSections,
    markdown: args.content,
  };
}

export function getStructuredSections(structuredData: unknown, fallbackContent?: string | null): StructuredDeliverableSection[] {
  const structured = structuredData as Partial<StructuredDeliverableData> | null | undefined;
  const sections = Array.isArray(structured?.sections)
    ? structured.sections.filter(
        (section): section is StructuredDeliverableSection =>
          Boolean(section) &&
          typeof section.key === 'string' &&
          typeof section.title === 'string' &&
          typeof section.body === 'string',
      )
    : [];

  if (sections.length > 0) return sections;

  if (!fallbackContent || fallbackContent.trim().length === 0) return [];

  return [
    {
      key: 'content',
      title: 'Content',
      required: true,
      body: fallbackContent.trim(),
      citations: extractTurnReferences(fallbackContent),
    },
  ];
}

export function getStructuredEvidenceRefs(structuredData: unknown, fallbackContent?: string | null): string[] {
  const structured = structuredData as Partial<StructuredDeliverableData> | null | undefined;
  if (Array.isArray(structured?.evidence_refs)) {
    return structured.evidence_refs.filter((value): value is string => typeof value === 'string');
  }
  return extractTurnReferences(fallbackContent ?? '');
}

export function getMissingRequiredSections(structuredData: unknown): string[] {
  const structured = structuredData as Partial<StructuredDeliverableData> | null | undefined;
  if (!Array.isArray(structured?.missing_required_sections)) return [];
  return structured.missing_required_sections.filter((value): value is string => typeof value === 'string');
}
