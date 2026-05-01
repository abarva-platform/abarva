export const CANONICAL_AUTH_EMAILS = [
  // Meridian Health System
  'nina.patel@meridian-health.example.com',
  'elena.rivera@meridian-health.example.com',
  'caleb.nguyen@meridian-health.example.com',
  'marcus.chen@meridian-health.example.com',
  'omar.rahman@meridian-health.example.com',
  'david.henderson@meridian-health.example.com',
  'rebecca.hollings@meridian-health.example.com',

  // Apex Retail Group
  'maya.desai@apex-retail.example.com',
  'noah.patel@apex-retail.example.com',
  'sofia.bennett@apex-retail.example.com',
  'camila.torres@apex-retail.example.com',
  'evelyn.brooks@apex-retail.example.com',
  'david.kim@apex-retail.example.com',
  'priya.nair@apex-retail.example.com',

  // First Capital
  'ethan.brooks@firstcapital.example.com',
  'lena.ortiz@firstcapital.example.com',
  'rachel.kim@firstcapital.example.com',
  'priya.mehta@firstcapital.example.com',
  'nadia.rahman@firstcapital.example.com',
  'james.park@firstcapital.example.com',
  'kevin.walsh@firstcapital.example.com',
] as const;

export const CANONICAL_CLIENT_ADMIN_EMAILS = [
  'nina.patel@meridian-health.example.com',
  'maya.desai@apex-retail.example.com',
  'ethan.brooks@firstcapital.example.com',
] as const;

export type CanonicalAuthEmail = (typeof CANONICAL_AUTH_EMAILS)[number];
