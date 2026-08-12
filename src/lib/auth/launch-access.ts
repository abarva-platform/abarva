import { type ClientKey } from "@/lib/client-config";

export type LaunchAccessRole = "admin" | "client" | "maestro";

export interface LaunchAccessProfile {
  email: string;
  role: LaunchAccessRole;
  clientKey?: ClientKey;
  label: string;
}

export function normalizeLaunchEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export const STATIC_LAUNCH_ACCESS_PROFILES = [
  {
    email: "admin@abarva.ai",
    role: "client",
    clientKey: "meridian",
    label: "Meridian launch login",
  },
  {
    email: "anand@abarva.ai",
    role: "admin",
    clientKey: "skyharbor",
    label: "SkyHarbor founder login",
  },
  {
    email: "anand.sundaram+apex@thesundaram.com",
    role: "client",
    clientKey: "apexretail",
    label: "Apex test login",
  },
  {
    email: "anand.sundaram+firstcapital@thesundaram.com",
    role: "client",
    clientKey: "arcturus",
    label: "First Capital test login",
  },
  {
    email: "anand.sundaram+meridian@thesundaram.com",
    role: "client",
    clientKey: "meridian",
    label: "Meridian test login",
  },
  {
    email: "anand.sundaram+skyharbor@thesundaram.com",
    role: "client",
    clientKey: "skyharbor",
    label: "SkyHarbor test login",
  },
  {
    email: "anand.sundaram+lakeshore@thesundaram.com",
    role: "client",
    clientKey: "lakeshore",
    label: "Lakeshore test login",
  },
  {
    email: "anand.sundaram@thesundaram.com",
    role: "client",
    clientKey: "meridian",
    label: "Meridian founder test login",
  },
  {
    email: "anandshp@gmail.com",
    role: "client",
    clientKey: "lakeshore",
    label: "Lakeshore founder test login",
  },
] as const satisfies readonly LaunchAccessProfile[];

const STATIC_PROFILE_BY_EMAIL: ReadonlyMap<string, LaunchAccessProfile> =
  new Map(
    STATIC_LAUNCH_ACCESS_PROFILES.map((profile) => [profile.email, profile]),
  );

export function getStaticLaunchAccessProfile(
  email: string | null | undefined,
): LaunchAccessProfile | null {
  return STATIC_PROFILE_BY_EMAIL.get(normalizeLaunchEmail(email)) ?? null;
}

export function isStaticLaunchApprovedEmail(
  email: string | null | undefined,
): boolean {
  return getStaticLaunchAccessProfile(email) !== null;
}
