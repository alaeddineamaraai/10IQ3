import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    viewTransition: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: "netset",
  project: "netset-pro",
  // Only upload source maps when SENTRY_AUTH_TOKEN is present (CI/production)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Disable source map upload locally; enable in CI by setting SENTRY_AUTH_TOKEN
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Tree-shake Sentry logger in production builds
  disableLogger: true,
  // Automatically tunnel Sentry requests to avoid ad blockers
  automaticVercelMonitors: false,
});
