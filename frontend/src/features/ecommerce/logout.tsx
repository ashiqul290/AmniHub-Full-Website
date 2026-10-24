"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { apiRequest } from "./api";
import { Shell } from "./marketplace";
import styles from "./marketplace.module.css";

export function LogoutPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not sign you out.");
    } finally {
      setBusy(false);
    }
  }

  return <Shell><main className={styles.page}><div className={styles.confirmation}><span className={styles.confirmIcon}><Check size={28} /></span><span className={styles.eyebrow}>ACCOUNT</span><h1>Sign out of Omni Market?</h1><p>Your cart stays saved to your account for next time.</p>{error && <div className={styles.error}>{error}</div>}<button className={styles.primaryButton} onClick={() => void signOut()} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button><Link className={styles.continue} href="/ecommerce"><ArrowLeft size={15} /> Back to shopping</Link></div></main></Shell>;
}
