// Environment Variable Validation
// Validates required env vars at startup to fail fast
// Call this in Server Components or API routes that depend on specific vars

/**
 * Environment variable specification
 */
interface EnvVarSpec {
  name: string;
  required: boolean;
  description: string;
}

/**
 * Required and optional environment variables
 */
const ENV_VARS: EnvVarSpec[] = [
  { name: "DATABASE_URL", required: true, description: "PostgreSQL connection string" },
  { name: "NEXTAUTH_URL", required: true, description: "Canonical app URL" },
  { name: "NEXTAUTH_SECRET", required: true, description: "NextAuth session encryption secret" },
  // Payment
  { name: "PAYMENT_GATEWAY", required: false, description: "Active payment gateway (creem|paddle)" },
  { name: "CREEM_API_KEY", required: false, description: "Creem API key" },
  { name: "CREEM_WEBHOOK_SECRET", required: false, description: "Creem webhook secret" },
  { name: "PADDLE_API_KEY", required: false, description: "Paddle API key (reserved)" },
  { name: "PADDLE_WEBHOOK_SECRET", required: false, description: "Paddle webhook secret (reserved)" },
  // LLM / AI
  { name: "LLM_PROVIDER", required: false, description: "LLM provider (openai|anthropic)" },
  { name: "OPENAI_API_KEY", required: false, description: "OpenAI API key" },
  { name: "OPENAI_MODEL", required: false, description: "OpenAI model (default: gpt-4o-mini)" },
  { name: "ANTHROPIC_API_KEY", required: false, description: "Anthropic API key" },
  { name: "ANTHROPIC_MODEL", required: false, description: "Anthropic model (default: claude-sonnet-4-20250514)" },
  // OAuth
  { name: "GOOGLE_CLIENT_ID", required: false, description: "Google OAuth client ID" },
  { name: "GOOGLE_CLIENT_SECRET", required: false, description: "Google OAuth client secret" },
  { name: "GITHUB_CLIENT_ID", required: false, description: "GitHub OAuth client ID" },
  { name: "GITHUB_CLIENT_SECRET", required: false, description: "GitHub OAuth client secret" },
  // Email
  { name: "RESEND_API_KEY", required: false, description: "Resend email API key" },
  { name: "SMTP_HOST", required: false, description: "SMTP server hostname" },
  { name: "SMTP_PORT", required: false, description: "SMTP server port" },
  { name: "SMTP_USER", required: false, description: "SMTP username" },
  { name: "SMTP_PASSWORD", required: false, description: "SMTP password" },
  { name: "SMTP_FROM", required: false, description: "Sender email address" },
  { name: "SMTP_REPLY_TO", required: false, description: "Reply-to email address" },
  { name: "SMTP_PROVIDER", required: false, description: "SMTP preset (gmail|outlook|sendgrid...)" },
  // i18n
  { name: "NEXT_PUBLIC_DEFAULT_LOCALE", required: false, description: "Default locale (default: en)" },
  // Sentry
  { name: "NEXT_PUBLIC_SENTRY_DSN", required: false, description: "Sentry client DSN for error monitoring" },
  { name: "SENTRY_DSN", required: false, description: "Sentry server/edge DSN for error monitoring" },
  { name: "SENTRY_ORG", required: false, description: "Sentry organization slug for sourcemap uploads" },
  { name: "SENTRY_PROJECT", required: false, description: "Sentry project slug for sourcemap uploads" },
  { name: "SENTRY_SILENT", required: false, description: "Suppress Sentry build warnings (true|false)" },
];

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate all environment variables
 * Returns missing required vars and optional var warnings
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const spec of ENV_VARS) {
    const value = process.env[spec.name];
    const isSet = value !== undefined && value !== "";

    if (spec.required && !isSet) {
      missing.push(`${spec.name} (${spec.description})`);
    } else if (!spec.required && !isSet) {
      warnings.push(`${spec.name} (${spec.description}) - using defaults`);
    }
  }

  // Check for default secrets in production
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.NEXTAUTH_SECRET ?? "";
    if (
      secret === "your-nextauth-secret-change-in-production" ||
      secret.length < 32
    ) {
      missing.push("NEXTAUTH_SECRET must be changed from default in production (min 32 chars)");
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate env vars and throw if required ones are missing
 * Use at app startup / layout level
 */
export function requireEnv(): void {
  const result = validateEnv();

  if (!result.valid) {
    console.error("[ENV] Missing required environment variables:");
    for (const m of result.missing) {
      console.error(`  - ${m}`);
    }
    throw new Error(
      `Missing ${result.missing.length} required environment variable(s). See server logs.`
    );
  }

  if (result.warnings.length > 0) {
    console.log("[ENV] Optional variables not set (using defaults):");
    for (const w of result.warnings) {
      console.log(`  - ${w}`);
    }
  }
}

/**
 * Get a typed environment variable or throw
 */
export function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || value === "") {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Get an optional environment variable with fallback
 */
export function getOptionalEnvVar(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}
