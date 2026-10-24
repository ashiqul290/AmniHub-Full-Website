"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Heart, MapPin, Package, Trash2, UserRound } from "lucide-react";
import { apiRequest } from "./api";
import { Shell } from "./marketplace";
import styles from "./marketplace.module.css";

type AccountUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  sellerStatus: string;
};
type CustomerAddress = {
  _id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};
const emptyAddress = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  postalCode: "",
  country: "",
  isDefault: false,
};

export function AccountDashboard() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [draft, setDraft] = useState(emptyAddress);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<{ user: AccountUser }>("/auth/me"),
      apiRequest<{ addresses: CustomerAddress[] }>("/addresses"),
    ])
      .then(([accountResult, addressResult]) => {
        if (!active) return;
        setUser(accountResult.user);
        setName(accountResult.user.name);
        setPhone(accountResult.user.phone);
        setAddresses(addressResult.addresses);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "We could not load your account.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ user: AccountUser }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name, phone }),
      });
      setUser(result.user);
      setNotice("Your profile has been updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profile update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ address: CustomerAddress }>("/addresses", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setAddresses((current) => [
        ...(draft.isDefault ? current.map((address) => ({ ...address, isDefault: false })) : current),
        result.address,
      ]);
      setDraft(emptyAddress);
      setNotice("Delivery address saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Address could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAddress(address: CustomerAddress) {
    if (!window.confirm("Remove this delivery address?")) return;
    setError("");
    try {
      await apiRequest(`/addresses/${address._id}`, { method: "DELETE" });
      setAddresses((current) => current.filter((item) => item._id !== address._id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Address could not be removed.");
    }
  }

  async function makeDefault(address: CustomerAddress) {
    setError("");
    try {
      await apiRequest(`/addresses/${address._id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...address, isDefault: true }),
      });
      setAddresses((current) => current.map((item) => ({ ...item, isDefault: item._id === address._id })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Default address could not be updated.");
    }
  }

  return <Shell><main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/ecommerce">Shop</Link><span>/</span> My account</div>
    <div className={styles.dashboardTitle}><div><span className={styles.eyebrow}>YOUR OMNI MARKET</span><h1>My account</h1></div>{user && <span className={styles.pill}>{user.role === "seller" ? `Seller · ${user.sellerStatus}` : user.role}</span>}</div>
    {error && <div className={styles.error}>{error}{/sign in|session has expired/i.test(error) && <> <Link href="/login">Sign in</Link></>}</div>}
    {notice && <div className={styles.success}>{notice}</div>}
    {loading ? <div className={styles.loading}>Loading your account…</div> : user ? <>
      <div className={styles.accountLinks}><Link href="/ecommerce/orders"><Package size={17} /> Order history <ArrowRight size={15} /></Link><Link href="/ecommerce/wishlist"><Heart size={17} /> Saved items <ArrowRight size={15} /></Link><Link href="/forgot-password"><UserRound size={17} /> Change password <ArrowRight size={15} /></Link></div>
      <div className={styles.dashboardGrid}>
        <form className={styles.dashboardPanel} onSubmit={saveProfile}>
          <h2>Profile details</h2>
          <label className={styles.compactField}>Full name<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className={styles.compactField}>Email<input readOnly value={user.email} /></label>
          <label className={styles.compactField}>Phone number<input maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <button className={styles.primaryButton} disabled={busy}>{busy ? "Saving…" : "Save profile"} <Check size={16} /></button>
        </form>
        <form className={styles.dashboardPanel} onSubmit={saveAddress}>
          <h2><MapPin size={18} /> Add a delivery address</h2>
          {(["name", "phone", "line1", "line2", "city", "postalCode", "country"] as const).map((key) => <label key={key} className={styles.compactField}>{key === "line1" ? "Street address" : key === "line2" ? "Apartment / unit (optional)" : key === "postalCode" ? "Postal code" : key.charAt(0).toUpperCase() + key.slice(1)}<input required={key !== "line2"} value={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
          <label className={styles.defaultAddress}><input type="checkbox" checked={draft.isDefault} onChange={(event) => setDraft((current) => ({ ...current, isDefault: event.target.checked }))} /> Set as default delivery address</label>
          <button className={styles.primaryButton} disabled={busy}>Save address <ArrowRight size={16} /></button>
        </form>
      </div>
      <section className={`${styles.dashboardPanel} ${styles.addressPanel}`}>
        <h2>Saved addresses</h2>
        {addresses.length ? addresses.map((address) => <article key={address._id} className={styles.addressCard}>
          <div><strong>{address.name}</strong>{address.isDefault && <span className={styles.orderStatus}>Default</span>}<p>{address.line1}{address.line2 && `, ${address.line2}`}<br />{address.city}, {address.postalCode}, {address.country}<br />{address.phone}</p></div>
          <div className={styles.actions}>{!address.isDefault && <button onClick={() => void makeDefault(address)}>Make default</button>}<button onClick={() => void deleteAddress(address)} aria-label="Delete address"><Trash2 size={14} /></button></div>
        </article>) : <p className={styles.muted}>You haven&apos;t saved a delivery address yet.</p>}
      </section>
    </> : <div className={styles.empty}><UserRound size={32} /><h2>Sign in to manage your account.</h2><Link href="/login" className={styles.primaryButton}>Sign in <ArrowRight size={16} /></Link></div>}
  </main></Shell>;
}
