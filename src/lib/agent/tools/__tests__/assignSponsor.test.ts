const mockRequireTenancy = jest.fn();
const mockGetProgramById = jest.fn();
const mockLoadUserProgramAccessPolicy = jest.fn();
const mockGetAzureWriteFluentClient = jest.fn();

jest.mock('../registry', () => ({ registerTool: jest.fn() }));
jest.mock('@/app/api/v1/programs/_auth', () => ({
  requireTenancy: () => mockRequireTenancy(),
  TenancyError: class TenancyError extends Error {
    code = 'unauthenticated';
  },
}));
jest.mock('@/lib/programs/queries', () => ({
  getProgramById: (...args: unknown[]) => mockGetProgramById(...args),
}));
jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    mockLoadUserProgramAccessPolicy(...args),
}));
jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => mockGetAzureWriteFluentClient(),
}));

import { assignSponsorTool } from '../program/assignSponsor';

const tenancy = {
  userId: 'authorized-user',
  clientId: 'client-1',
  clientKey: 'tenant-a',
  role: 'client_member',
};

function makeClient() {
  const query: Record<string, jest.Mock> = {};
  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.maybeSingle = jest.fn(async () => ({ data: null, error: null }));
  query.insert = jest.fn(async () => ({ error: null }));
  return {
    from: jest.fn(() => query),
    query,
  };
}

describe('assign_sponsor contact authority', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue(tenancy);
    mockGetProgramById.mockResolvedValue({ id: 'move-1' });
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      canApproveGates: true,
      canAdminUsers: false,
    });
  });

  it('refuses contact changes from a user without Move approval or admin authority', async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      canApproveGates: false,
      canAdminUsers: false,
    });

    const result = await assignSponsorTool.handler(
      { program_id: 'move-1', person_id: 'person-1' },
      {} as never,
    );

    expect(result).toMatchObject({
      success: false,
      error: 'forbidden:authorized_workspace_user_required',
    });
    expect(mockGetAzureWriteFluentClient).not.toHaveBeenCalled();
  });

  it('refuses contact changes outside the authorized Move scope', async () => {
    mockLoadUserProgramAccessPolicy.mockResolvedValue({
      canApproveGates: true,
      canAdminUsers: false,
      programIdsAllowed: ['another-move'],
    });

    const result = await assignSponsorTool.handler(
      { program_id: 'move-1', person_id: 'person-1' },
      {} as never,
    );

    expect(result).toMatchObject({
      success: false,
      error: 'forbidden:authorized_workspace_user_required',
    });
    expect(mockGetAzureWriteFluentClient).not.toHaveBeenCalled();
  });

  it.each([
    [undefined, []],
    [false, []],
    [true, ['phase_gate']],
  ])(
    'keeps the contact read-only and email preference explicit (%s)',
    async (sendProgressEmails, notifyOn) => {
      const client = makeClient();
      mockGetAzureWriteFluentClient.mockReturnValue(client);

      const result = await assignSponsorTool.handler(
        {
          program_id: 'move-1',
          person_id: 'person-1',
          send_progress_emails: sendProgressEmails,
        },
        {} as never,
      );

      expect(result).toMatchObject({ success: true });
      expect(mockLoadUserProgramAccessPolicy).toHaveBeenCalledWith(tenancy, {
        programId: 'move-1',
      });
      expect(client.query.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'Sponsor',
          approval_authority: 'contributor',
          notify_on: notifyOn,
          program_access_level: 'program_viewer',
          can_view_financial: false,
          can_upload: false,
          can_generate_deliverables: false,
          can_publish_deliverables: false,
          can_approve_phase_gates: false,
        }),
      );
    },
  );
});
