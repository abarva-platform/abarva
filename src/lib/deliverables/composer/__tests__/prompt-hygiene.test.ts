import { checkPromptHygiene, assertPromptHygiene } from '../prompt-hygiene';

describe('prompt hygiene', () => {
  it('passes an ordinary prompt', () => {
    expect(checkPromptHygiene('Write the section using evidence [12] and [13].').clean).toBe(true);
  });

  it('catches the exact defect that reached a rendered document', () => {
    // "- [133] undefined: <statement>" in the required-signals block, copied
    // verbatim by the model into the body and blocked three steps later.
    const v = checkPromptHygiene('REQUIRED SIGNALS:\n- [133] undefined: 8 AI programmes carry $56.6M.');
    expect(v.clean).toBe(false);
    expect(v.findings[0].marker).toBe('interpolated undefined');
    expect(v.findings[0].firstContext).toContain('[133]');
  });

  it('does not fire on prose that merely contains the words', () => {
    // Governed content legitimately discusses undefined scope and null results.
    // A check that flagged these would be switched off within a week.
    const prose = 'The scope is currently undefined_scope_key and the nullable column is documented.';
    expect(checkPromptHygiene(prose).clean).toBe(true);
  });

  it('catches a stringified object, an unresolved template and Invalid Date', () => {
    expect(checkPromptHygiene('owner: [object Object]').findings[0].marker).toBe('stringified object');
    expect(checkPromptHygiene('due ${dueDate} today').findings[0].marker).toBe('unresolved template');
    expect(checkPromptHygiene('extracted Invalid Date').findings[0].marker).toBe('Invalid Date');
  });

  it('does not flag an empty JSON array in a schema hint', () => {
    // Nine false positives on a real prompt, all of them correct JSON. The
    // marker was removed rather than tuned: a gate that cries wolf on valid
    // content gets ignored wholesale.
    const schema = 'Return {"evidenceCitations":[n],"assumptionsUsed":[],"placeholders":[]}';
    expect(checkPromptHygiene(schema).clean).toBe(true);
  });

  it('catches NaN where a figure belongs', () => {
    expect(checkPromptHygiene('adoption: NaN% against target').clean).toBe(false);
  });

  it('counts every occurrence, so one example does not imply one defect', () => {
    const v = checkPromptHygiene('- [1] undefined: a\n- [2] undefined: b\n- [3] undefined: c');
    expect(v.findings[0].count).toBe(3);
  });

  it('throws with the marker and its context, naming the prompt', () => {
    expect(() => assertPromptHygiene('- [9] undefined: x', 'architect')).toThrow(/architect.*interpolated undefined/s);
  });
});
