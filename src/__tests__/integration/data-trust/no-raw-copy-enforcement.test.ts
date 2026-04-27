// DATA3 · No-Raw-Copy Mode Enforcement tests.
//
// Pure deterministic coverage of the no-raw-copy enforcement layer.

import {
  buildNoRawCopyGateSeed,
  evaluateNoRawCopyGate,
  inspectForRawPayload,
  summarizeNoRawCopyGate,
  RAW_PAYLOAD_VIOLATION_CATEGORIES_IN_ORDER,
  type NoRawCopyGateInput,
} from '@/lib/data-trust/no-raw-copy-enforcement';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildNoRawCopyGateSeed · determinism', () => {
  it('returns a deterministic seed across repeated calls', () => {
    const a = buildNoRawCopyGateSeed();
    const b = buildNoRawCopyGateSeed();
    expect(a).toEqual(b);
  });

  it('serialized seed is byte-equal across repeated calls', () => {
    const a = JSON.stringify(buildNoRawCopyGateSeed());
    const b = JSON.stringify(buildNoRawCopyGateSeed());
    expect(a).toBe(b);
  });

  it('returns at least 5 seed inputs', () => {
    expect(buildNoRawCopyGateSeed().length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------
// inspectForRawPayload · clean values
// ---------------------------------------------------------------------

describe('inspectForRawPayload · clean values', () => {
  it('clean label value passes inspection', () => {
    const result = inspectForRawPayload('Tier 1 deflection rate · Q1 2026');
    expect(result.isRawPayload).toBe(false);
    expect(result.violations).toHaveLength(0);
  });

  it('clean free-form location label passes inspection', () => {
    const result = inspectForRawPayload(
      'Client-side · Genesys reporting warehouse · Q1 slice',
      'rawDataLocation',
    );
    expect(result.isRawPayload).toBe(false);
  });

  it('short numeric string passes inspection', () => {
    const result = inspectForRawPayload('12,400', 'value');
    expect(result.isRawPayload).toBe(false);
  });

  it('currency label passes inspection', () => {
    const result = inspectForRawPayload('USD 4,200,000', 'value');
    expect(result.isRawPayload).toBe(false);
  });

  it('percentage passes inspection', () => {
    const result = inspectForRawPayload('88.0', 'value');
    expect(result.isRawPayload).toBe(false);
  });
});

// ---------------------------------------------------------------------
// inspectForRawPayload · URL scheme detection
// ---------------------------------------------------------------------

describe('inspectForRawPayload · URL scheme detection', () => {
  it('detects https URL', () => {
    const result = inspectForRawPayload(
      'See https://internal.example.com/data',
    );
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('url_scheme_detected');
  });

  it('detects http URL', () => {
    const result = inspectForRawPayload('http://api.example.com/endpoint');
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('url_scheme_detected');
  });

  it('detects jdbc URL', () => {
    const result = inspectForRawPayload('jdbc:postgresql://db.host:5432/prod');
    expect(result.isRawPayload).toBe(true);
  });
});

// ---------------------------------------------------------------------
// inspectForRawPayload · long alphanumeric token
// ---------------------------------------------------------------------

describe('inspectForRawPayload · long alphanumeric token', () => {
  it('detects a 40-char hex hash', () => {
    const result = inspectForRawPayload(
      'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    );
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('long_alphanumeric_token');
  });

  it('does not flag a short alphanumeric string', () => {
    const result = inspectForRawPayload('abc123def456');
    expect(result.isRawPayload).toBe(false);
  });
});

// ---------------------------------------------------------------------
// inspectForRawPayload · base64 blob
// ---------------------------------------------------------------------

describe('inspectForRawPayload · base64 blob', () => {
  it('detects a base64-encoded string', () => {
    const result = inspectForRawPayload(
      'dGhpcyBpcyBhIHRlc3QgYmFzZTY0IGJsb2IgdGhhdCBzaG91bGQgYmUgcmVqZWN0ZWQ=',
    );
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('base64_blob');
  });

  it('does not flag a short string ending in equals', () => {
    const result = inspectForRawPayload('value=5');
    expect(result.isRawPayload).toBe(false);
  });
});

// ---------------------------------------------------------------------
// inspectForRawPayload · connection string
// ---------------------------------------------------------------------

describe('inspectForRawPayload · connection string', () => {
  it('detects Server= connection string', () => {
    const result = inspectForRawPayload(
      'Server=tcp:db.example.com;Database=prod;User Id=admin;Password=secret',
    );
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('connection_string_pattern');
  });

  it('detects Password= pattern', () => {
    const result = inspectForRawPayload('Password=mySecret123');
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('connection_string_pattern');
  });

  it('does not flag normal text with the word "data"', () => {
    const result = inspectForRawPayload('Customer data summary for Q1');
    expect(result.isRawPayload).toBe(false);
  });
});

// ---------------------------------------------------------------------
// inspectForRawPayload · PII patterns
// ---------------------------------------------------------------------

describe('inspectForRawPayload · PII patterns', () => {
  it('detects SSN pattern', () => {
    const result = inspectForRawPayload('Employee SSN: 123-45-6789');
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('pii_pattern');
  });

  it('detects email address', () => {
    const result = inspectForRawPayload('Contact: john.doe@example.com');
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('pii_pattern');
  });

  it('does not flag generic label text', () => {
    const result = inspectForRawPayload('Finance Business Partner — Customer Operations');
    expect(result.isRawPayload).toBe(false);
  });
});

// ---------------------------------------------------------------------
// inspectForRawPayload · empty value
// ---------------------------------------------------------------------

describe('inspectForRawPayload · empty value', () => {
  it('flags empty string as empty_value violation', () => {
    const result = inspectForRawPayload('');
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('empty_value');
  });

  it('flags whitespace-only string as empty_value violation', () => {
    const result = inspectForRawPayload('   ');
    expect(result.isRawPayload).toBe(true);
    expect(result.violations).toContain('empty_value');
  });
});

// ---------------------------------------------------------------------
// evaluateNoRawCopyGate · block without L4 approval
// ---------------------------------------------------------------------

describe('evaluateNoRawCopyGate · blocked cases', () => {
  it('blocks URL-containing value without L4 approval', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test-url',
      value: 'See https://example.com/data',
      hasL4NamedApproval: false,
    };
    const decision = evaluateNoRawCopyGate(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons.some((r) => r.includes('url_scheme_detected'))).toBe(true);
  });

  it('blocks connection string always (even with L4 approval)', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test-conn',
      value: 'Server=db.host;Password=secret123;',
      hasL4NamedApproval: true,
    };
    const decision = evaluateNoRawCopyGate(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons.some((r) => r.includes('connection_string_pattern'))).toBe(true);
  });

  it('blocks PII always (even with L4 approval)', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test-pii',
      value: 'SSN: 123-45-6789',
      hasL4NamedApproval: true,
    };
    const decision = evaluateNoRawCopyGate(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons.some((r) => r.includes('pii_pattern'))).toBe(true);
  });

  it('blocks base64 blob always', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test-b64',
      value:
        'dGhpcyBpcyBhIHRlc3QgYmFzZTY0IGJsb2IgdGhhdCBzaG91bGQgYmUgcmVqZWN0ZWQ=',
      hasL4NamedApproval: true,
    };
    const decision = evaluateNoRawCopyGate(input);
    expect(decision.permitted).toBe(false);
  });

  it('blocks empty value', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test-empty',
      value: '',
      hasL4NamedApproval: false,
    };
    const decision = evaluateNoRawCopyGate(input);
    expect(decision.permitted).toBe(false);
    expect(decision.reasons.some((r) => r.includes('empty_value'))).toBe(true);
  });
});

// ---------------------------------------------------------------------
// evaluateNoRawCopyGate · permitted cases
// ---------------------------------------------------------------------

describe('evaluateNoRawCopyGate · permitted cases', () => {
  it('permits clean label value', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test-clean',
      value: 'Tier 1 deflection rate · Q1 2026',
      hasL4NamedApproval: false,
    };
    const decision = evaluateNoRawCopyGate(input);
    expect(decision.permitted).toBe(true);
    expect(decision.reasons).toHaveLength(0);
  });

  it('permits URL-containing value WITH L4 named approval', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test-url-l4',
      value: 'See https://internal.example.com/data',
      hasL4NamedApproval: true,
    };
    const decision = evaluateNoRawCopyGate(input);
    expect(decision.permitted).toBe(true);
  });

  it('permits clean location label', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test-location',
      value: 'Client-side · Genesys CCaaS reporting warehouse · Q1 slice',
      fieldLabel: 'rawDataLocation',
      hasL4NamedApproval: false,
    };
    const decision = evaluateNoRawCopyGate(input);
    expect(decision.permitted).toBe(true);
  });
});

// ---------------------------------------------------------------------
// evaluateNoRawCopyGate · output shape
// ---------------------------------------------------------------------

describe('evaluateNoRawCopyGate · output shape', () => {
  it('carries the correct createdFrom marker', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test',
      value: 'Clean label',
      hasL4NamedApproval: false,
    };
    const decision = evaluateNoRawCopyGate(input);
    expect(decision.createdFrom).toBe(
      'deterministic_no_raw_copy_enforcement_seed',
    );
  });

  it('includes a non-empty disclosure for every decision', () => {
    const inputs = buildNoRawCopyGateSeed();
    for (const input of inputs) {
      const decision = evaluateNoRawCopyGate(input);
      expect(decision.disclosure.length).toBeGreaterThan(10);
    }
  });

  it('is deterministic for the same input', () => {
    const input: NoRawCopyGateInput = {
      inputId: 'test-det',
      value: 'some clean value · Q1 2026',
      hasL4NamedApproval: false,
    };
    const a = evaluateNoRawCopyGate(input);
    const b = evaluateNoRawCopyGate(input);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------
// Seed inputs — mix of clean and dirty
// ---------------------------------------------------------------------

describe('buildNoRawCopyGateSeed · mixed results', () => {
  it('seed contains both permitted and blocked inputs', () => {
    const inputs = buildNoRawCopyGateSeed();
    const decisions = inputs.map((i) => evaluateNoRawCopyGate(i));
    const permitted = decisions.filter((d) => d.permitted);
    const blocked = decisions.filter((d) => !d.permitted);
    expect(permitted.length).toBeGreaterThan(0);
    expect(blocked.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// summarizeNoRawCopyGate
// ---------------------------------------------------------------------

describe('summarizeNoRawCopyGate', () => {
  it('total matches input length', () => {
    const inputs = buildNoRawCopyGateSeed();
    const summary = summarizeNoRawCopyGate(inputs);
    expect(summary.total).toBe(inputs.length);
  });

  it('permittedTotal + blockedTotal == total', () => {
    const inputs = buildNoRawCopyGateSeed();
    const summary = summarizeNoRawCopyGate(inputs);
    expect(summary.permittedTotal + summary.blockedTotal).toBe(summary.total);
  });

  it('returns zeros for empty input', () => {
    const summary = summarizeNoRawCopyGate([]);
    expect(summary.total).toBe(0);
    expect(summary.permittedTotal).toBe(0);
    expect(summary.blockedTotal).toBe(0);
  });

  it('is deterministic for the same input', () => {
    const inputs = buildNoRawCopyGateSeed();
    expect(JSON.stringify(summarizeNoRawCopyGate(inputs))).toBe(
      JSON.stringify(summarizeNoRawCopyGate(inputs)),
    );
  });
});

// ---------------------------------------------------------------------
// Canonical orderings
// ---------------------------------------------------------------------

describe('RAW_PAYLOAD_VIOLATION_CATEGORIES_IN_ORDER', () => {
  it('contains exactly 7 canonical violation categories', () => {
    expect(RAW_PAYLOAD_VIOLATION_CATEGORIES_IN_ORDER).toHaveLength(7);
  });

  it('includes pii_pattern and connection_string_pattern', () => {
    expect(RAW_PAYLOAD_VIOLATION_CATEGORIES_IN_ORDER).toContain('pii_pattern');
    expect(RAW_PAYLOAD_VIOLATION_CATEGORIES_IN_ORDER).toContain(
      'connection_string_pattern',
    );
  });
});
