// Environment access with a hard failure in production.
//
// Every secret used to have an inline fallback (`?? 'chess-dev-secret'`). That made a
// missing variable invisible: the API would boot and sign JWTs with a value published in
// the repository, so anyone could forge an ADMIN token. Production must refuse to start
// instead; development keeps the convenience default.

const isProduction = (): boolean => process.env.NODE_ENV === 'production'

/**
 * Reads a required variable. In production a missing value throws; outside production it
 * falls back to `devFallback` so `pnpm dev` works without a fully populated .env.
 */
export function requireEnv(name: string, devFallback: string): string {
  const value = process.env[name]
  if (value) return value

  if (isProduction()) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        'Set it in the deployment environment before starting the API.',
    )
  }

  return devFallback
}

// Fallback shared by the JWT signer and the JWT verifier: both must derive the secret the
// same way, or tokens issued at login would fail verification on the next request.
export const SESSION_SECRET_DEV_FALLBACK = 'chess-dev-secret'

export const getSessionSecret = (): string =>
  requireEnv('SESSION_SECRET', SESSION_SECRET_DEV_FALLBACK)

/** Browser origin allowed to call the API. Only `/blunder` calls it from the browser. */
export const getWebOrigin = (): string => requireEnv('WEB_ORIGIN', 'http://localhost:3000')
