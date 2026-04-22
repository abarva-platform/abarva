import { parseTurnPayload } from '@/hooks/useNexusStream'

describe('parseTurnPayload', () => {
  test('parses plain JSON payloads from Nexus streaming output', () => {
    expect(
      parseTurnPayload('{"format":"one_sentence","hero":"Ambient documentation","answer":"Peers are consolidating around two vendors."}'),
    ).toEqual({
      format: 'one_sentence',
      hero: 'Ambient documentation',
      answer: 'Peers are consolidating around two vendors.',
    })
  })

  test('parses fenced JSON payloads from model output', () => {
    expect(
      parseTurnPayload('```json\n{"format":"crux","crux":"Pick Abridge if ED speed matters most."}\n```'),
    ).toEqual({
      format: 'crux',
      crux: 'Pick Abridge if ED speed matters most.',
    })
  })

  test('falls back to an idk payload when the stream is not valid JSON', () => {
    expect(parseTurnPayload('plain text fallback')).toEqual({
      format: 'idk',
      answer: 'plain text fallback',
      why_dont_know: undefined,
    })
  })

  test('uses fallback copy when the stream is empty', () => {
    expect(parseTurnPayload('', { answer: 'Fallback answer' })).toEqual({
      format: 'idk',
      answer: 'Fallback answer',
      why_dont_know: 'The streaming payload did not include a complete renderable body.',
    })
  })

  test('preserves side-channel contradiction metadata in the parsed payload', () => {
    expect(
      parseTurnPayload(
        '{"format":"crux","hero":"Pathology changes the recommendation pressure.","contradiction_self_check":{"prior_turn_id":"nexus-grounded-3","prior_summary":"ED-primary decision frame favored Abridge.","current_departure":"Adding pathology re-opens the DAX comparison and changes the rollout logic.","reconciliation_paths":["Keep pathology out of phase 1","Re-run the vendor comparison with pathology in scope"]}}',
      ),
    ).toEqual({
      format: 'crux',
      hero: 'Pathology changes the recommendation pressure.',
      contradiction_self_check: {
        prior_turn_id: 'nexus-grounded-3',
        prior_summary: 'ED-primary decision frame favored Abridge.',
        current_departure: 'Adding pathology re-opens the DAX comparison and changes the rollout logic.',
        reconciliation_paths: ['Keep pathology out of phase 1', 'Re-run the vendor comparison with pathology in scope'],
      },
    })
  })
})
