export type DeploymentTarget = "local" | "preview" | "production";

type EnvLike = Partial<Record<string, string | undefined>>;

const DEFAULT_LOCAL_ORIGIN = "http://localhost:3000";

function normalizeOrigin(value?: string): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getDeploymentTarget(env: EnvLike = process.env): DeploymentTarget {
  const nodeEnv = env.NODE_ENV;
  const branch = env.AWS_BRANCH;
  const productionBranch = env.AMPLIFY_PRODUCTION_BRANCH;

  if (nodeEnv !== "production") {
    return "local";
  }

  if (branch && productionBranch && branch !== productionBranch) {
    return "preview";
  }

  return "production";
}

export function getAppOrigin(env: EnvLike = process.env): string {
  return (
    normalizeOrigin(env.NEXT_PUBLIC_APP_URL) ??
    normalizeOrigin(env.AMPLIFY_APP_ORIGIN) ??
    DEFAULT_LOCAL_ORIGIN
  );
}

export function getPasswordResetRedirectUrl(env: EnvLike = process.env): string {
  return `${getAppOrigin(env)}/auth/reset-password`;
}

export function isExplicitLocalBypassEnabled(env: EnvLike = process.env): boolean {
  return (
    getDeploymentTarget(env) === "local" &&
    env.ULTRA_ENABLE_ADMIN_LIVE_MAP_DEV_BYPASS === "true"
  );
}
