"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function VerifyForm() {
  const router=useRouter();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);setError("");
    const code=String(new FormData(event.currentTarget).get("code")||"");
    try {
      const result=await authClient.twoFactor.verifyTotp({code,trustDevice:false});
      if(result.error) {setError(result.error.message||"Verification failed");return;}
      router.push("/staff");router.refresh();
    } catch {setError("Verification is currently unavailable");}
    finally {setLoading(false);}
  }
  return (
    <form className="staff-form" onSubmit={submit}>
      <label htmlFor="staff-totp">6-digit code from your authenticator</label>
      <input id="staff-totp" name="code" inputMode="numeric" autoComplete="one-time-code"
        pattern="[0-9]{6}" maxLength={6} required />
      {error && <p role="alert" className="staff-error">{error}</p>}
      <button className="button button-primary" type="submit" disabled={loading}>{loading?"Verifying…":"Verify and continue"}</button>
    </form>
  );
}
