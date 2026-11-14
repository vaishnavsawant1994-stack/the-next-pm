import Link from "next/link";
import { SignInForm } from "@/components/staff/SignInForm";
export const metadata={title:"Staff sign in | The Next PM"};
export default function StaffSignIn() {
  return <div className="container page-shell staff-auth-shell">
    <span className="section-kicker">PRIVATE EDITORIAL ACCESS</span>
    <h1 className="page-title">Staff sign in</h1>
    <p className="page-intro">Accounts are provisioned by authorized operators. Public sign-up is disabled.</p>
    <SignInForm/>
    <p className="staff-subtle"><Link href="/">← Return to the public website</Link></p>
  </div>;
}
