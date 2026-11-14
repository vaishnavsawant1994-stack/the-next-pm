import type { Metadata } from "next";
import { ElectionCard } from "@/components/ElectionCard";
import { load2027StateCatalog } from "@/lib/server/states";

export const metadata: Metadata = { title: "States — 2027 Elections" };

export const dynamic = "force-dynamic";

export default async function StatesPage() {
  const { states: states2027 } = await load2027StateCatalog();
  return (
    <div className="container page-shell">
      <span className="section-kicker">2027 / STATE DIRECTORY</span>
      <h1 className="page-title">Explore states</h1>
      <p className="page-intro">These seven state profiles are the first coverage wave. Other states and union territories will be added as the platform expands.</p>
      <div className="card-grid">{states2027.map((state) => <ElectionCard key={state.slug} state={state} />)}</div>
    </div>
  );
}
