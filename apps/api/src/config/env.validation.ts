type Environment = Record<string, string | undefined>;

type ValidatedEnvironment = Record<string, string | number | undefined> & {
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT: number;
};

const DEFAULT_PORT = 3000;

function requireValue(env: Environment, key: string): string {
  const value = env[key];

  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

function requireProductionValues(env: Environment, keys: string[]): void {
  if (env['NODE_ENV'] !== 'production') {
    return;
  }

  for (const key of keys) {
    requireValue(env, key);
  }
}

export function validateEnvironment(env: Environment): ValidatedEnvironment {
  const { PORT, ...rest } = env;
  requireProductionValues(env, [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
    'REDIS_URL',
    'MEILISEARCH_HOST',
    'MEILISEARCH_API_KEY',
  ]);

  const jwtSecret = requireValue(env, 'JWT_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long',
    );
  }

  return {
    ...rest,
    DATABASE_URL: requireValue(env, 'DATABASE_URL'),
    JWT_SECRET: jwtSecret,
    PORT: parsePort(PORT),
  } as ValidatedEnvironment;
}
