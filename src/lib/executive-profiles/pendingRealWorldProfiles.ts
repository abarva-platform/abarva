export interface PendingRealWorldExecutiveProfile {
  id: string;
  fullName: string;
}

// Ethics-review hold set from the Wave 3 C12 spec and executive profile seed.
// These profiles must never render substantive content until explicitly cleared.
export const PENDING_REAL_WORLD_EXECUTIVE_PROFILES: PendingRealWorldExecutiveProfile[] = [
  { id: 'e8277566-f510-47d2-a8be-b7f241e072ad', fullName: 'Prat Vemana' },
  { id: 'b9b61439-91cf-4700-9b36-efcd6c1c760b', fullName: 'Shail Jain' },
  { id: '7beff229-4b99-4b64-8e9b-9c78d0a78181', fullName: 'Tim Peterson' },
  { id: 'd0c26cb6-d0d9-439d-95d7-7d259046d8f4', fullName: 'Ranjan Goswami' },
];

export function getPendingRealWorldExecutiveProfile(id: string): PendingRealWorldExecutiveProfile | null {
  return PENDING_REAL_WORLD_EXECUTIVE_PROFILES.find((profile) => profile.id === id) ?? null;
}
