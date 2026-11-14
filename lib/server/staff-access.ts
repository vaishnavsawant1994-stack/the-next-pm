import { auth } from "@/lib/auth";
import { getDatabasePool } from "@/lib/server/db";

export type StaffRole = "admin" | "operator" | "reviewer" | "publisher";
export type StaffIdentity = {
  id: string;
  email: string;
  displayName: string;
  role: StaffRole;
};

export class StaffAccessError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_SECRET.length >= 32 && process.env.BETTER_AUTH_URL);
}

export async function getStaffForHeaders(
  incoming: Headers, options: { allowUnenrolledMfa?: boolean } = {}
): Promise<{ staff: StaffIdentity; twoFactorEnabled: boolean }> {
  if (!isAuthConfigured()) throw new StaffAccessError(503, "Staff authentication is not configured");
  const session = await auth.api.getSession({ headers: incoming });
  if (!session?.user) throw new StaffAccessError(401, "Sign in required");
  if (session.session && "impersonatedBy" in session.session && session.session.impersonatedBy) {
    throw new StaffAccessError(403, "Impersonated sessions cannot access editorial controls");
  }
  if (!session.user.emailVerified) throw new StaffAccessError(403, "Verified staff email required");
  const pool = getDatabasePool();
  if (!pool) throw new StaffAccessError(503, "Database unavailable");

  const result = await pool.query(
    "SELECT id,email,display_name,role FROM staff_members " +
    "WHERE auth_user_id=$1 AND lower(email)=lower($2) AND active=true",
    [session.user.id, session.user.email]
  );
  const row = result.rows[0];
  if (!row) throw new StaffAccessError(403, "This account is not provisioned for editorial access");
  const enabled = Boolean(session.user.twoFactorEnabled);
  if (!enabled && !options.allowUnenrolledMfa) {
    throw new StaffAccessError(428, "Staff two-factor enrollment required");
  }
  return {
    staff: { id: row.id, email: row.email, displayName: row.display_name, role: row.role },
    twoFactorEnabled: enabled,
  };
}

export function requireStaffRole(staff: StaffIdentity, roles: StaffRole[]): void {
  if (!roles.includes(staff.role)) throw new StaffAccessError(403, "Insufficient editorial permission");
}
