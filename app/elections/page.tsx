import type { Metadata } from "next";
import { ElectionCard } from "@/components/ElectionCard";
import { load2027StateCatalog } from "@/lib/server/states";

export const metadata: Metadata = { title: "2027 Elections" };

export const dynamic = "force-dynamic";

export default async function ElectionsPage() {
  const { states: states2027 } = await load2027StateCatalog();
  const seatTotal2027 = states2027.reduce((sum,state) => sum + state.seats,0);
  const early = states2027.filter((s) => s.wave === "early-2027");
  const late = states2027.filter((s) => s.wave === "late-2027");
  return (
    <div className="container page-shell">
      <span className="section-kicker">ELECTION DIRECTORY / 2027</span>
      <h1 className="page-title">2027 State Elections</h1>
      <p className="page-intro">Explore seven expected state-election cycles covering {seatTotal2027} Assembly seats. These are planning windows unless individually marked with a verified official announcement. <strong>Do not treat unannounced windows as polling dates.</strong></p>
      <div className="notice"><strong>Important:</strong> Only independently reviewed official Election Commission sources may change an election from expected to announced. This site does not yet publish election results or candidate nominations.</div>
      <div className="section-heading minor-heading"><div><h2>Early 2027 planning window</h2><p>Five expected Assembly election cycles.</p></div></div>
      <div className="card-grid">{early.map((state) => <ElectionCard key={state.slug} state={state} />)}</div>
      <div className="section-heading minor-heading"><div><h2>Late 2027 planning window</h2><p>Himachal Pradesh's Assembly term ends in January 2028; its poll window is expected in late 2027, subject to official notification.</p></div></div>
      <div className="card-grid">{late.map((state) => <ElectionCard key={state.slug} state={state} />)}</div>
      <p className="source-note">Source for Assembly terms: <a href="https://www.eci.gov.in/term-of-the-houses/" rel="noopener noreferrer" target="_blank">Election Commission of India ↗</a>.</p>
    </div>
  );
}
