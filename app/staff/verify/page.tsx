import { VerifyForm } from "@/components/staff/VerifyForm";
export const metadata={title:"Verify authenticator | The Next PM"};
export default function StaffVerify() {
  return <div className="container page-shell staff-auth-shell">
    <span className="section-kicker">SECURE STAFF SESSION</span>
    <h1 className="page-title">Verify authenticator</h1>
    <p className="page-intro">Enter the temporary code from the authenticator linked to your staff account.</p>
    <VerifyForm/>
  </div>;
}
