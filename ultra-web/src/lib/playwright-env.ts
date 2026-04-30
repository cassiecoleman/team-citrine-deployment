type EnvLike = Partial<Record<string, string | undefined>>;

export interface PlaywrightRuntimeConfig {
  baseURL: string;
  webServerCommand: string | null;
  webServerUrl: string | null;
}

export function getPlaywrightRuntimeConfig(
  env: EnvLike = process.env,
): PlaywrightRuntimeConfig {
  const hostedBaseUrl = env.PLAYWRIGHT_BASE_URL;

  if (hostedBaseUrl) {
    return {
      baseURL: hostedBaseUrl,
      webServerCommand: null,
      webServerUrl: null,
    };
  }

  const port = Number(env.PLAYWRIGHT_PORT ?? 3000);
  const baseURL = `http://localhost:${port}`;

  return {
    baseURL,
    webServerCommand: `PORT=${port} npm run dev`,
    webServerUrl: baseURL,
  };
}
