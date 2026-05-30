export async function generateFollowups(args: {
  query: string;
  answer: string;
  entities: string[];
  tenantId?: string | null;
  userId?: string | null;
}): Promise<string[]> {
  const query = args.query.toLowerCase();
  const answer = args.answer.toLowerCase();
  const entity = args.entities.find(Boolean);

  if (/\b(vendor|contract|renewal|sourcing|ibm|aws|fis|dxc)\b/.test(`${query} ${answer}`)) {
    return [
      'Show the renewal leverage',
      'Name the risks to watch',
      'Hand this to Source',
    ];
  }

  if (/\b(value|savings|cost|spend|npv|roi|business case|fund)\b/.test(`${query} ${answer}`)) {
    return [
      'Show the value evidence',
      'Pressure-test the assumptions',
      'Shape this as a Move',
    ];
  }

  if (/\b(risk|security|cyber|regulatory|compliance|hipaa|model risk)\b/.test(`${query} ${answer}`)) {
    return [
      'Show the control gaps',
      'Name the decision owner',
      'What evidence changes this view?',
    ];
  }

  if (entity) {
    return [
      `Go deeper on ${entity}`,
      'Show the evidence',
      'What would you do next?',
    ];
  }

  return [
    'Show the evidence',
    'What is the next move?',
    'What would change your view?',
  ];
}
