const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "REDUCTO_API_KEY",
  "OPENAI_API_KEY"
] as const;

type RequiredEnvKey = (typeof requiredEnv)[number];

type EnvConfig = Record<RequiredEnvKey, string>;

export function getEnv(): EnvConfig {
  const missing: RequiredEnvKey[] = [];
  const config = {} as EnvConfig;

  for (const key of requiredEnv) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      config[key] = value;
    }
  }

  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  return config;
}

export function getOptionalEnv(key: string) {
  return process.env[key];
}
