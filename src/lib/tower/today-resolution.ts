export const TOWER_DEFAULT_DEMO_TODAY = '2026-05-12';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type TowerTodayEnv = {
  readonly [key: string]: string | undefined;
};

export function resolveTowerToday(
  env: TowerTodayEnv = process.env,
): string {
  const override = env.TOWER_DEMO_TODAY;
  if (override && ISO_DATE_PATTERN.test(override)) {
    return override;
  }

  return TOWER_DEFAULT_DEMO_TODAY;
}
