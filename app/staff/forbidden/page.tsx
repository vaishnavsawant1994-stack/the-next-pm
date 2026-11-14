import Link from "next/link";
export const metadata={title:"Staff access restricted | The Next PM"};
export default function StaffForbidden() {
  return <div className="container page-shell readable">
    <span className="section-kicker">ACCESS RESTRICTED</span>
    <h1 className="page-title">No editorial permission</h1>
    <p className="page-intro">Your signed-in account has not been linked to an active staff record. An authorized administrator must provision access.</p>
    <Link className="button button-outline" href="/">Return to public website</Link>
  </div>;
}
