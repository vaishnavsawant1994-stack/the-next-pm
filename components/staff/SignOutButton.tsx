"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
export function SignOutButton() {
  const router=useRouter();
  return <button type="button" className="button button-outline" onClick={async()=>{
    await authClient.signOut();
    router.push("/staff/sign-in");
    router.refresh();
  }}>Sign out</button>;
}
