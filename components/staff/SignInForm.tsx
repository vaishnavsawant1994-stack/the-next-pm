"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const router=useRouter();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data=new FormData(event.currentTarget);
    try {
      const result=await authClient.signIn.email({
        email:String(data.get("email")||""),
        password:String(data.get("password")||""),
      });
      if (result.error) {setError(result.error.message||"Unable to sign in");return;}
      if (result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) {
        router.push("/staff/verify");
      } else {
        router.push("/staff");
      }
      router.refresh();
    } catch {setError("Sign-in service is unavailable");}
    finally {setLoading(false);}
  }
  return (
    <form className="staff-form" onSubmit={submit}>
      <label htmlFor="staff-email">Verified staff email</label>
      <input id="staff-email" name="email" type="email" autoComplete="username" maxLength={254} required />
      <label htmlFor="staff-password">Password</label>
      <input id="staff-password" name="password" type="password" autoComplete="current-password" minLength={12} required />
      {error && <p role="alert" className="staff-error">{error}</p>}
      <button className="button button-primary" disabled={loading} type="submit">{loading?"Checking…":"Sign in"}</button>
    </form>
  );
}
