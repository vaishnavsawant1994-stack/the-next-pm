"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SignOutButton } from "@/components/staff/SignOutButton";
import type { StaffRole } from "@/lib/server/staff-access";

export type SourceRecord = {
  id: string; title: string; publisher: string; source_url: string;
  review_status: string; captured_at: string; review_notes: string | null;
};
export type ChangeRecord = {
  id: string; region_slug: string; status: string;
  proposed_poll_date: string | null; submitted_at: string;
  source_url: string; review_notes: string | null;
};
export type RegionRecord = { slug: string; name: string; status: string };
export type ImportBatchRecord = {
  id: string; region_slug: string; status: string; row_count: number;
  submitted_at: string; source_url: string; review_notes: string | null;
};


export function EditorialConsole({
  name, role, sources, changes, regions, batches,
}: {
  name: string; role: StaffRole;
  sources: SourceRecord[];
  changes: ChangeRecord[];
  regions: RegionRecord[];
  batches: ImportBatchRecord[];
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const canPropose = role === "admin" || role === "operator";
  const canReview = role === "admin" || role === "reviewer";
  const canPublish = role === "admin" || role === "publisher";

  async function perform(payload: Record<string,string>) {
    setWorking(true);
    setFeedback("");
    try {
      const response = await fetch("/api/staff/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Operation not completed");
      setFeedback("Saved and audited: " + payload.action);
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to save");
    } finally {
      setWorking(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const payload: Record<string,string> = { action };
    for (const [key,value] of Object.entries(values)) payload[key] = String(value);
    void perform(payload).then(() => {
      if (action === "source:add" || action === "calendar:propose") form.reset();
    });
  }


  async function submitCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form=event.currentTarget;
    const data=new FormData(form);
    const file=data.get("file");
    if (!(file instanceof File)) {setFeedback("Choose a UTF-8 CSV file first");return;}
    if(file.size>90_000) {setFeedback("CSV exceeds the 90 KB upload limit");return;}
    const csv=await file.text();
    await perform({action:"constituency:submit",csv,sourceId:String(data.get("sourceId")||"")});
  }

  function sendAction(action: string, id: string) {
    void perform({ action, id });
  }

  return <div className="staff-console">
    <div className="staff-console-header">
      <div><span className="section-kicker">PRIVATE EDITORIAL OPERATIONS</span><h1 className="page-title">Editorial administration</h1><p>Signed in as {name} · Role: <strong>{role}</strong></p></div>
      <SignOutButton/>
    </div>
    <div className="notice">
      Only original, independently checked ECI announcements may change an election calendar.
      A proposer, reviewer and publisher must be three distinct staff identities.
      Never use this interface with fabricated polling dates.
    </div>
    {feedback && <p className="staff-feedback" role="status">{feedback}</p>}
    <div className="staff-kpi">
      <article><strong>{sources.length}</strong><span>Recent source records</span></article>
      <article><strong>{sources.filter(s=>s.review_status==="pending").length}</strong><span>Sources requiring review</span></article>
      <article><strong>{changes.filter(c=>c.status==="pending").length}</strong><span>Calendar proposals for review</span></article>
    </div>

    <section className="staff-section">
      <h2>1. Official source registry</h2>
      <p>Submitted links start in pending state and need a different reviewer to inspect the actual notice.</p>
      {canPropose && <form className="staff-form staff-form-wide" onSubmit={e=>submit(e,"source:add")}>
        <label htmlFor="source-url">ECI source URL</label>
        <input id="source-url" name="url" type="url" placeholder="https://www.eci.gov.in/..." required maxLength={2048}/>
        <label htmlFor="source-title">Document title</label>
        <input id="source-title" name="title" maxLength={300} required/>
        <label htmlFor="source-publisher">Publisher</label>
        <input id="source-publisher" name="publisher" defaultValue="Election Commission of India" maxLength={200} required/>
        <button className="button button-primary" type="submit" disabled={working}>Submit source for review</button>
      </form>}
      <div className="staff-data-list">
        {sources.length===0 && <p>No source records have been entered.</p>}
        {sources.map(source=><article key={source.id} className="staff-list-item">
          <div><span className="status-chip">{source.review_status}</span><h3>{source.title}</h3>
            <p>{source.publisher} · Added {source.captured_at}</p>
            <a href={source.source_url} target="_blank" rel="noopener noreferrer">{source.source_url}</a>
          </div>
          {canReview && source.review_status==="pending" && <form className="staff-form" onSubmit={e=>submit(e,"source:review")}>
            <input type="hidden" name="id" value={source.id}/>
            <label htmlFor={"source-decision-"+source.id}>Verification decision</label>
            <select id={"source-decision-"+source.id} name="decision" required>
              <option value="verified">Verified against original ECI notice</option>
              <option value="rejected">Reject or request correction</option>
            </select>
            <label htmlFor={"source-notes-"+source.id}>Evidence review notes (at least 20 characters)</label>
            <textarea id={"source-notes-"+source.id} name="notes" minLength={20} maxLength={1000} required rows={3}/>
            <button type="submit" className="button button-outline" disabled={working}>Record review</button>
          </form>}
        </article>)}
      </div>
    </section>

    <section className="staff-section">
      <h2>2. Election calendar publication</h2>
      <p>Only reviewed source IDs may support an official polling date. Pending proposals are not displayed as official dates.</p>
      {canPropose && <form className="staff-form staff-form-wide" onSubmit={e=>submit(e,"calendar:propose")}>
        <label htmlFor="calendar-region">State</label>
        <select id="calendar-region" name="region" required defaultValue="">
          <option value="" disabled>Select a state</option>
          {regions.filter(r=>r.status==="expected").map(r=><option key={r.slug} value={r.slug}>{r.name}</option>)}
        </select>
        <label htmlFor="calendar-date">Official polling date (from verified ECI notice)</label>
        <input id="calendar-date" name="pollDate" type="date" required />
        <label htmlFor="calendar-source">Verified document</label>
        <select id="calendar-source" name="sourceId" required defaultValue="">
          <option value="" disabled>Select verified original source</option>
          {sources.filter(s=>s.review_status==="verified").map(s=><option key={s.id} value={s.id}>{s.title} · {s.id.slice(0,8)}</option>)}
        </select>
        <button className="button button-primary" type="submit" disabled={working}>Submit announcement for independent review</button>
      </form>}

      <div className="staff-data-list">
        {changes.length===0 && <p>No calendar proposals yet.</p>}
        {changes.map(change=><article className="staff-list-item" key={change.id}>
          <div><span className="status-chip">{change.status}</span><h3>{change.region_slug} · {change.proposed_poll_date||"No date"}</h3>
            <p>Submitted {change.submitted_at}</p>
            <a href={change.source_url} target="_blank" rel="noopener noreferrer">Open supporting ECI source ↗</a>
            {change.review_notes && <p>Reviewer notes: {change.review_notes}</p>}
          </div>
          {canReview && change.status==="pending" && <form className="staff-form" onSubmit={e=>submit(e,"calendar:review")}>
            <input name="id" type="hidden" value={change.id}/>
            <label htmlFor={"review-decision-"+change.id}>Decision</label>
            <select id={"review-decision-"+change.id} name="decision" required>
              <option value="approved">Approve after checking full original notice</option>
              <option value="rejected">Reject</option>
            </select>
            <label htmlFor={"review-notes-"+change.id}>Notes (at least 20 characters)</label>
            <textarea id={"review-notes-"+change.id} name="notes" required minLength={20} maxLength={1000} rows={3}/>
            <button type="submit" className="button button-outline" disabled={working}>Record independent review</button>
          </form>}
          {canPublish && change.status==="approved" &&
            <button type="button" className="button button-primary" disabled={working}
              onClick={()=>sendAction("calendar:publish",change.id)}>Publish approved announcement</button>}
        </article>)}
      </div>
    </section>

    <section className="staff-section">
      <h2>3. Constituency import batches</h2>
      <p>Import a single state per CSV with these exact columns: state_slug, seat_number, seat_name, boundary_version. All records remain private drafts until approved by a different reviewer and published by a third staff member.</p>
      {canPropose && <form className="staff-form staff-form-wide" onSubmit={submitCsv}>
        <label htmlFor="constituency-csv">UTF-8 constituency CSV</label>
        <input id="constituency-csv" name="file" type="file" accept=".csv,text/csv" required />
        <label htmlFor="constituency-source">Independently verified ECI source document</label>
        <select id="constituency-source" name="sourceId" required defaultValue="">
          <option value="" disabled>Choose verified source</option>
          {sources.filter(s=>s.review_status==="verified").map(s=><option key={s.id} value={s.id}>{s.title} · {s.id.slice(0,8)}</option>)}
        </select>
        <button type="submit" className="button button-primary" disabled={working}>Submit private draft batch</button>
      </form>}
      <div className="staff-data-list">
        {batches.length===0 && <p>No constituency batches have been imported yet.</p>}
        {batches.map(batch=><article className="staff-list-item" key={batch.id}>
          <div>
            <span className="status-chip">{batch.status}</span>
            <h3>{batch.region_slug} · {batch.row_count} constituency records</h3>
            <p>Submitted {batch.submitted_at}</p>
            <a href={batch.source_url} target="_blank" rel="noopener noreferrer">Open supporting source ↗</a>
            {batch.review_notes && <p>Review: {batch.review_notes}</p>}
          </div>
          {canReview && batch.status==="pending" && <form className="staff-form" onSubmit={e=>submit(e,"constituency:review")}>
            <input type="hidden" name="id" value={batch.id}/>
            <label htmlFor={"batch-decision-"+batch.id}>Batch review</label>
            <select id={"batch-decision-"+batch.id} name="decision" required>
              <option value="approved">Approve after reviewing original source and records</option>
              <option value="rejected">Reject and discard unpublished drafts</option>
            </select>
            <label htmlFor={"batch-notes-"+batch.id}>Review evidence (at least 20 characters)</label>
            <textarea id={"batch-notes-"+batch.id} name="notes" minLength={20} maxLength={1000} required rows={3}/>
            <button type="submit" className="button button-outline" disabled={working}>Record batch review</button>
          </form>}
          {canPublish && batch.status==="approved" && <button type="button" disabled={working}
            className="button button-primary" onClick={()=>sendAction("constituency:publish",batch.id)}>
              Publish reviewed constituency records
            </button>}
        </article>)}
      </div>
    </section>

    <p className="staff-subtle">Protected staff view. Source rights, legal review and actual notice authenticity remain editorial responsibilities.</p>
  </div>;
}
