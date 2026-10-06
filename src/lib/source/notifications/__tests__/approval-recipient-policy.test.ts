import {
  isApprovedTestRecipient,
  soleApprovalParticipant,
  soleSponsorApprovalParticipant,
} from '../approval-recipient-policy';

const assigned = {
  user_id: 'user_approver',
  approval_authority: 'approver',
  can_approve_source_stages: true,
};

test('selects only a uniquely assigned approval participant', () => {
  expect(soleApprovalParticipant([assigned])).toEqual(assigned);
  expect(soleApprovalParticipant([{ ...assigned, approval_authority: 'contributor', can_approve_source_stages: false }])).toBeNull();
  expect(soleApprovalParticipant([assigned, { ...assigned, user_id: 'user_other' }])).toBeNull();
  expect(soleApprovalParticipant([{ ...assigned, user_id: '' }])).toBeNull();
});

test('synthetic recipient allowlist rejects an arbitrary address', () => {
  expect(isApprovedTestRecipient('outsider@example.com', undefined)).toBe(false);
  expect(isApprovedTestRecipient('admin@abarva.ai', undefined)).toBe(true);
  expect(isApprovedTestRecipient('TEST@ABARVA.AI', 'test@abarva.ai')).toBe(true);
  expect(isApprovedTestRecipient('test@abarva.ai.evil.test', 'test@abarva.ai')).toBe(false);
});

test('sponsor notices require one explicitly assigned sponsor with stage approval access', () => {
  const sponsor = { ...assigned, role: 'sponsor' };
  expect(soleSponsorApprovalParticipant([sponsor])).toEqual(sponsor);
  expect(soleSponsorApprovalParticipant([{ ...assigned, role: 'admin' }])).toBeNull();
  expect(soleSponsorApprovalParticipant([{ ...sponsor, can_approve_source_stages: false }])).toBeNull();
  expect(soleSponsorApprovalParticipant([sponsor, { ...sponsor, user_id: 'user_other' }])).toBeNull();
  expect(soleSponsorApprovalParticipant([{ ...sponsor, user_id: '' }])).toBeNull();
});
