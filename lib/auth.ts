import { betterAuth } from "better-auth";
import { admin, twoFactor } from "better-auth/plugins";
import { Pool } from "pg";

// This module must also be loadable by the auth-schema CLI before production
// secrets are provisioned. Route handlers reject traffic without real secrets.
export const auth = betterAuth({
  appName: "The Next PM",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "UNCONFIGURED-BETTER-AUTH-SECRET-DISABLED",
  database: new Pool({
    connectionString: process.env.DATABASE_URL ||
      "postgresql://disabled:disabled@localhost:5432/no_database_configured",
    max: 5,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    autoSignIn: false,
  },
  plugins: [admin(), twoFactor({ issuer: "The Next PM" })],
});
