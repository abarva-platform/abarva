import { isSyntheticE2eOperatorProfile } from "../synthetic-e2e-operator";

const profile = {
  accountType: "synthetic_e2e_operator",
  automated: true,
  approvalRef: "private-approval-reference",
  role: "client",
  clientId: "meridian",
  defaultClientId: "meridian",
  clientLocked: true,
  moduleAccess: ["programs"],
  programScope: "assigned_programs_only",
  programCapabilities: {
    accessLevel: "program_member",
    canCreatePrograms: true,
    canApproveGates: true,
    financialVisibility: true,
    canAdminUsers: false,
    canUploadArtifacts: true,
    canGenerateDeliverables: true,
    canPublishDeliverables: true,
  },
};

it("accepts only the exact dedicated signed profile", () => {
  expect(isSyntheticE2eOperatorProfile(profile)).toBe(true);
  expect(isSyntheticE2eOperatorProfile({ ...profile, clientId: "skyharbor" })).toBe(false);
  expect(isSyntheticE2eOperatorProfile({ ...profile, role: "maestro" })).toBe(false);
  expect(isSyntheticE2eOperatorProfile({ ...profile, moduleAccess: ["programs", "source"] })).toBe(false);
  expect(isSyntheticE2eOperatorProfile({ ...profile, programCapabilities: {
    ...profile.programCapabilities, canAdminUsers: true,
  } })).toBe(false);
  expect(isSyntheticE2eOperatorProfile({ ...profile, tenantRoles: { meridian: "tenant_admin" } })).toBe(false);
  expect(isSyntheticE2eOperatorProfile({ ...profile, approvalRef: "" })).toBe(false);
  expect(isSyntheticE2eOperatorProfile({ ...profile, person_id: "00000000-0000-4000-8000-000000000001" })).toBe(false);
});
