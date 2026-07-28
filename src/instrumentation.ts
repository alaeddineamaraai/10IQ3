import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.05,
      enabled: !!process.env.SENTRY_DSN,
    });
  }
}

// Catches unhandled errors in server components, route handlers, and server actions.
// Type is intentionally loose to match Next.js's own onRequestError signature.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onRequestError: (...args: any[]) => void =
  Sentry.captureRequestError;
