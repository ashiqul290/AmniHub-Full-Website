"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import styles from "./auth-pages.module.css";

function AuthBrand() {
  return (
    <Link href="/" className={styles.brand} aria-label="OmniHub home">
      <span className={styles.brandMark} aria-hidden="true">
        <Layers3 size={22} strokeWidth={2.3} />
      </span>
      <span>OmniHub</span>
    </Link>
  );
}

function EcosystemArtwork() {
  return (
    <div className={styles.artwork} aria-label="OmniHub connected services illustration">
      <div className={styles.artGlow} />
      <div className={`${styles.orbit} ${styles.orbitOuter}`} />
      <div className={`${styles.orbit} ${styles.orbitInner}`} />
      <div className={`${styles.floatIcon} ${styles.floatShopping}`}>
        <Layers3 size={20} />
      </div>
      <div className={`${styles.floatIcon} ${styles.floatWork}`}>
        <BriefcaseBusiness size={20} />
      </div>
      <div className={`${styles.floatIcon} ${styles.floatLearning}`}>
        <GraduationCap size={21} />
      </div>
      <div className={`${styles.floatIcon} ${styles.floatCommunity}`}>
        <UsersRound size={20} />
      </div>
      <div className={styles.artworkCard}>
        <span className={styles.artworkBadge}><Sparkles size={16} /> YOUR WORLD, CONNECTED</span>
        <h2>One place for<br />what matters.</h2>
        <p>Discover more possibilities in every part of your day.</p>
        <div className={styles.artworkServices} aria-hidden="true">
          <span><Layers3 size={16} /></span>
          <span><BriefcaseBusiness size={16} /></span>
          <span><GraduationCap size={16} /></span>
          <span><Building2 size={16} /></span>
          <span className={styles.serviceMore}>+16</span>
        </div>
      </div>
      <div className={styles.artworkNote}>
        <span className={styles.noteCheck}><ShieldCheck size={17} /></span>
        <span><strong>One connected experience</strong><small>Made for your day</small></span>
      </div>
    </div>
  );
}

function AuthLayout({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "login" | "register";
}) {
  return (
    <main className={`${styles.page} ${variant === "register" ? styles.registerPage : ""}`}>
      <section className={styles.formSide}>
        <div className={styles.formTop}>
          <AuthBrand />
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={15} /> Back to home
          </Link>
        </div>
        <div className={styles.formContent}>{children}</div>
        <p className={styles.formFootnote}>© 2026 OmniHub. All rights reserved.</p>
      </section>
      <aside className={styles.visualSide}>
        <EcosystemArtwork />
        <div className={styles.visualCaption}>
          <span className={styles.captionKicker}>ONE PLATFORM. ENDLESS POSSIBILITIES.</span>
          <h2>Your digital world,<br />all in one place.</h2>
          <p>Shop, work, learn, and connect with a more seamless experience.</p>
        </div>
        <div className={styles.visualDots} aria-hidden="true"><span /><span /><span /></div>
      </aside>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.inputWrap}>
        <LockKeyhole className={styles.inputIcon} size={17} aria-hidden="true" />
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder="Enter your password"
          required
        />
        <button
          className={styles.passwordToggle}
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function LoginPageContent() {
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  function keepSubmissionLocal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <AuthLayout variant="login">
      <div className={styles.formHeading}>
        <span className={styles.welcomeMark}><Sparkles size={17} /></span>
        <h1>Welcome Back!</h1>
        <p>Sign in to continue to OmniHub.</p>
      </div>
      <form className={styles.form} onSubmit={keepSubmissionLocal}>
        <div className={styles.field}>
          <label htmlFor="login-email">Email address</label>
          <div className={styles.inputWrap}>
            <Mail className={styles.inputIcon} size={17} aria-hidden="true" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          visible={passwordVisible}
          onToggle={() => setPasswordVisible((visible) => !visible)}
          autoComplete="current-password"
        />
        <div className={styles.formOptions}>
          <label className={styles.checkLabel}>
            <input type="checkbox" name="remember" />
            <span>Remember me</span>
          </label>
          <Link href="#forgot-password">Forgot password?</Link>
        </div>
        <button className={styles.submitButton} type="submit">
          Sign In <ArrowRight size={17} />
        </button>
        <div className={styles.divider}><span>or continue with</span></div>
        <button className={styles.googleButton} type="button">
          <GoogleMark /> Continue with Google
        </button>
      </form>
      <p className={styles.switchPrompt}>
        Don&apos;t have an account? <Link href="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

export function RegistrationPageContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  function keepSubmissionLocal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <AuthLayout variant="register">
      <div className={styles.formHeading}>
        <span className={styles.welcomeMark}><Sparkles size={17} /></span>
        <h1>Create Your Account</h1>
        <p>Join OmniHub and explore endless possibilities.</p>
      </div>
      <form className={`${styles.form} ${styles.registerForm}`} onSubmit={keepSubmissionLocal}>
        <div className={styles.field}>
          <label htmlFor="register-name">Full name</label>
          <div className={styles.inputWrap}>
            <UserRound className={styles.inputIcon} size={17} aria-hidden="true" />
            <input id="register-name" name="name" autoComplete="name" placeholder="Your full name" required />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="register-email">Email address</label>
          <div className={styles.inputWrap}>
            <Mail className={styles.inputIcon} size={17} aria-hidden="true" />
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="register-phone">Phone number</label>
          <div className={styles.inputWrap}>
            <span className={styles.phonePrefix}>+</span>
            <input id="register-phone" name="phone" type="tel" autoComplete="tel" placeholder="1 555 000 0000" required />
          </div>
        </div>
        <PasswordField
          id="register-password"
          label="Password"
          value={password}
          onChange={setPassword}
          visible={passwordVisible}
          onToggle={() => setPasswordVisible((visible) => !visible)}
          autoComplete="new-password"
        />
        <PasswordField
          id="register-confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={confirmVisible}
          onToggle={() => setConfirmVisible((visible) => !visible)}
          autoComplete="new-password"
        />
        <label className={`${styles.checkLabel} ${styles.termsLabel}`}>
          <input type="checkbox" name="terms" required />
          <span>I agree to the <Link href="#terms">Terms &amp; Conditions</Link></span>
        </label>
        <button className={styles.submitButton} type="submit">
          Create Account <ArrowRight size={17} />
        </button>
        <div className={styles.divider}><span>or sign up with</span></div>
        <button className={styles.googleButton} type="button">
          <GoogleMark /> Continue with Google
        </button>
      </form>
      <p className={styles.switchPrompt}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

function GoogleMark() {
  return <span className={styles.googleMark} aria-hidden="true">G</span>;
}

const profileDetails = [
  { label: "Full name", value: "Alex Morgan", icon: UserRound },
  { label: "Email address", value: "alex.morgan@example.com", icon: Mail },
  { label: "Phone number", value: "+1 (555) 014-2086", icon: Phone },
];

const profileRoles = [
  { label: "Individual", icon: UserRound, color: "roleBlue" },
  { label: "Professional", icon: BriefcaseBusiness, color: "rolePurple" },
  { label: "Business owner", icon: Building2, color: "roleGreen" },
];

export function ProfilePageContent() {
  return (
    <main className={styles.profilePage}>
      <header className={styles.profileHeader}>
        <AuthBrand />
        <Link href="/" className={styles.backLink}><ArrowLeft size={15} /> Back to home</Link>
      </header>
      <div className={styles.profileContent}>
        <div className={styles.profileHeading}>
          <span className={styles.sectionKicker}>YOUR OMNIHUB</span>
          <h1>Profile</h1>
          <p>Manage your personal details and explore your connected roles.</p>
        </div>
        <section className={styles.profileHero}>
          <div className={styles.profileIdentity}>
            <div className={styles.avatar} aria-label="Alex Morgan profile avatar">AM</div>
            <div>
              <h2>Alex Morgan</h2>
              <p>alex.morgan@example.com</p>
              <span className={styles.memberBadge}><ShieldCheck size={14} /> OmniHub member</span>
            </div>
          </div>
          <button className={styles.editButton} type="button">Edit Profile</button>
        </section>
        <div className={styles.profileColumns}>
          <section className={styles.profilePanel}>
            <div className={styles.panelHeading}>
              <div><h2>Account information</h2><p>Your details at a glance</p></div>
              <span className={styles.panelIcon}><UserRound size={19} /></span>
            </div>
            <div className={styles.accountList}>
              {profileDetails.map(({ label, value, icon: Icon }) => (
                <div className={styles.accountItem} key={label}>
                  <span className={styles.accountIcon}><Icon size={17} /></span>
                  <span><small>{label}</small><strong>{value}</strong></span>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.profilePanel}>
            <div className={styles.panelHeading}>
              <div><h2>Selected roles</h2><p>Ways you can use OmniHub</p></div>
              <span className={`${styles.panelIcon} ${styles.panelIconPurple}`}><Layers3 size={19} /></span>
            </div>
            <div className={styles.roleList}>
              {profileRoles.map(({ label, icon: Icon, color }) => (
                <div className={styles.roleItem} key={label}>
                  <span className={`${styles.roleIcon} ${styles[color as keyof typeof styles]}`}>
                    <Icon size={18} />
                  </span>
                  <span>{label}</span>
                  <span className={styles.roleSelected}>Selected</span>
                </div>
              ))}
            </div>
            <p className={styles.rolesFootnote}>Your experiences, brought together in one place.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
