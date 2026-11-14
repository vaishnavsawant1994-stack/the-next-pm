"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function EnrollTwoFactor() {
  const router=useRouter();
  const [totpURI,setTotpURI]=useState("");
  const [backupCodes,setBackupCodes]=useState<string[]>([]);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  async function enable(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError("");
    const password=String(new FormData(event.currentTarget).get("password")||"");
    try {
      const result=await authClient.twoFactor.enable({password,issuer:"The Next PM"});
      if(result.error) {setError(result.error.message||"Unable to begin MFA enrollment");return;}
      setTotpURI(result.data?.totpURI||"");
      setBackupCodes(result.data?.backupCodes||[]);
    } catch {setError("MFA enrollment unavailable");}
    finally {setBusy(false);}
  }
  async function verify(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError("");
    const code=String(new FormData(event.currentTarget).get("code")||"");
    try {
      const result=await authClient.twoFactor.verifyTotp({code,trustDevice:false});
      if(result.error) {setError(result.error.message||"Invalid code");return;}
      setTotpURI("");setBackupCodes([]);
      router.push("/staff");router.refresh();
    } catch {setError("Verification unavailable");}
    finally {setBusy(false);}
  }
  return <>
    <p className="page-intro">Editorial publishing requires a verified authenticator. Keep recovery codes outside your browser and do not share them in chat.</p>
    {!totpURI ? (
      <form className="staff-form" onSubmit={enable}>
        <label htmlFor="enroll-password">Confirm your staff password</label>
        <input name="password" id="enroll-password" type="password" autoComplete="current-password" required/>
        <button className="button button-primary" disabled={busy} type="submit">Enable authenticator</button>
      </form>
    ) : (
      <>
        <div className="notice">Add the following TOTP enrollment URI to your authenticator app. Keep it private; it contains a security secret.</div>
        <p className="staff-secret">{totpURI}</p>
        <h2>Recovery codes</h2>
        <p>Store these codes in a password manager before continuing. They are shown only during enrollment.</p>
        <div className="staff-recovery-codes" role="group" aria-label="One-time recovery codes">
          {backupCodes.map(code=><code key={code}>{code}</code>)}
        </div>
        <form className="staff-form" onSubmit={verify}>
          <label htmlFor="enroll-code">Authenticator code</label>
          <input id="enroll-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required/>
          <button type="submit" className="button button-primary" disabled={busy}>Verify and finish enrollment</button>
        </form>
      </>
    )}
    {error && <p role="alert" className="staff-error">{error}</p>}
  </>;
}
