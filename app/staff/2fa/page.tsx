import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EnrollTwoFactor } from "@/components/staff/EnrollTwoFactor";
import { getStaffForHeaders, StaffAccessError } from "@/lib/server/staff-access";

export const dynamic="force-dynamic";
export const metadata={title:"Set up MFA | The Next PM"};
export default async function StaffEnrollMfa() {
  try {
    const result=await getStaffForHeaders(await headers(),{allowUnenrolledMfa:true});
    if(result.twoFactorEnabled) redirect("/staff");
  } catch(error) {
    if(error instanceof StaffAccessError) {
      if(error.status===401) redirect("/staff/sign-in");
      if(error.status===403) redirect("/staff/forbidden");
    }
    throw error;
  }
  return <div className="container page-shell staff-auth-shell">
    <span className="section-kicker">MANDATORY STAFF SECURITY</span>
    <h1 className="page-title">Set up two-factor authentication</h1>
    <EnrollTwoFactor/>
  </div>;
}
