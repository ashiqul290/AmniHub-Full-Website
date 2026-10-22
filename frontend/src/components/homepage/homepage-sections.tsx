import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  Compass,
  GraduationCap,
  Heart,
  Layers3,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound,
  Wrench,
} from "lucide-react";
import { platformFeatures } from "@/data/homepage";

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="brand-link" aria-label="OmniHub home">
      <span className="brand-mark" aria-hidden="true">
        <Layers3 size={22} strokeWidth={2.3} />
      </span>
      <span className={`brand-name${light ? " text-white" : ""}`}>OmniHub</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <div className="header-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search OmniHub"
            placeholder="Search anything on OmniHub..."
          />
          <kbd>⌘ K</kbd>
        </div>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link className="nav-explore" href="#explore">
            <Compass size={17} aria-hidden="true" />
            Explore
          </Link>
          <Link className="nav-login" href="/login">
            Log in
          </Link>
          <Link className="button button-small" href="/register">
            Sign up
          </Link>
        </nav>
        <details className="mobile-menu">
          <summary aria-label="Open navigation menu">
            <Menu size={22} aria-hidden="true" />
          </summary>
          <nav aria-label="Mobile navigation">
            <Link href="#explore">Explore</Link>
            <Link href="/login">Log in</Link>
            <Link href="/register">Sign up</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

function EcosystemVisual() {
  return (
    <div className="ecosystem-visual" aria-label="A connected set of OmniHub services">
      <div className="visual-glow visual-glow-one" />
      <div className="visual-glow visual-glow-two" />
      <div className="visual-orbit orbit-one" />
      <div className="visual-orbit orbit-two" />
      <div className="orbit-icon orbit-shop">
        <ShoppingBag size={20} />
      </div>
      <div className="orbit-icon orbit-work">
        <BriefcaseBusiness size={20} />
      </div>
      <div className="orbit-icon orbit-learn">
        <GraduationCap size={21} />
      </div>
      <div className="orbit-icon orbit-connect">
        <UsersRound size={20} />
      </div>
      <div className="orbit-icon orbit-ai">
        <Sparkles size={20} />
      </div>
      <div className="ecosystem-card">
        <div className="ecosystem-card-top">
          <span className="ecosystem-card-icon">
            <Layers3 size={18} />
          </span>
          <span className="live-indicator">
            <span /> All connected
          </span>
        </div>
        <p className="ecosystem-card-eyebrow">YOUR DIGITAL WORLD</p>
        <h2>One place for it all.</h2>
        <p className="ecosystem-card-copy">
          The services you need, working better together.
        </p>
        <div className="connected-services" aria-hidden="true">
          <span><ShoppingBag size={15} /></span>
          <span><BriefcaseBusiness size={15} /></span>
          <span><GraduationCap size={15} /></span>
          <span><UsersRound size={15} /></span>
          <span><Sparkles size={15} /></span>
          <span className="service-count">+15</span>
        </div>
        <div className="ecosystem-card-footer">
          <span>20 connected experiences</span>
          <ArrowUpRight size={16} />
        </div>
      </div>
      <div className="floating-note">
        <span className="floating-note-icon"><Check size={15} /></span>
        <span><strong>Made for your day</strong><small>Everything in sync</small></span>
      </div>
      <div className="floating-sparkle" aria-hidden="true">
        <Sparkles size={22} />
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="eyebrow-pill">
            <span className="eyebrow-dot" />
            INTRODUCING OMNIHUB
          </span>
          <h1>
            One Platform.
            <br />
            <span>Endless Possibilities.</span>
          </h1>
          <p className="hero-description">
            Discover a smarter way to shop, work, learn, connect, and manage
            your business. Everything you need, all in one connected platform.
          </p>
          <div className="hero-actions">
            <Link className="button" href="#explore">
              Explore Platform <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="button button-secondary" href="#why-omnihub">
              Discover Features
            </Link>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars" aria-hidden="true">
              <span>J</span><span>M</span><span>A</span><span>+</span>
            </div>
            <p><strong>One connected experience</strong><br />for every part of life</p>
          </div>
        </div>
        <EcosystemVisual />
      </div>
    </section>
  );
}

export function FeatureSection() {
  return (
    <section className="section section-features" id="explore">
      <div className="section-heading">
        <span className="section-kicker">A WORLD OF POSSIBILITIES</span>
        <h2>Explore OmniHub</h2>
        <p>Everything you need, connected in one platform.</p>
      </div>
      <div className="feature-grid">
        {platformFeatures.map(({ title, href, icon: Icon, iconColor, iconBackground, accent }) => (
          <Link
            className="feature-card"
            href={href}
            key={href}
            style={{ "--feature-accent": accent } as CSSProperties}
          >
            <span className="feature-icon" style={{ backgroundColor: iconBackground }}>
              <Icon
                size={23}
                strokeWidth={2.5}
                color={iconColor}
                aria-hidden="true"
              />
            </span>
            <span className="feature-card-title">{title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const featuredContent = [
  {
    category: "SHOPPING",
    title: "Trending Products",
    description: "Fresh finds and everyday favorites, all in one place.",
    icon: ShoppingBag,
    visual: "preview-products",
    visualLabel: "Curated finds",
  },
  {
    category: "CAREER",
    title: "Latest Job Opportunities",
    description: "Find a role that fits your next big move.",
    icon: BriefcaseBusiness,
    visual: "preview-jobs",
    visualLabel: "Your next chapter",
  },
  {
    category: "LEARNING",
    title: "Popular Online Courses",
    description: "Build practical skills at your own pace.",
    icon: GraduationCap,
    visual: "preview-courses",
    visualLabel: "Learn something new",
  },
  {
    category: "PROFESSIONALS",
    title: "Featured Professional Services",
    description: "Meet skilled people ready to help you get it done.",
    icon: Wrench,
    visual: "preview-services",
    visualLabel: "Great work starts here",
  },
];

export function FeaturedSection() {
  return (
    <section className="section featured-section" id="discover">
      <div className="section-heading">
        <span className="section-kicker">A LITTLE INSPIRATION</span>
        <h2>Discover What&apos;s Possible</h2>
        <p>A glimpse at the people, ideas, and opportunities waiting for you.</p>
      </div>
      <div className="featured-grid">
        {featuredContent.map(({ category, title, description, icon: Icon, visual, visualLabel }) => (
          <article className="featured-card" key={title}>
            <div className={`featured-visual ${visual}`}>
              <div className="visual-decoration" aria-hidden="true">
                <Icon size={31} strokeWidth={1.6} />
              </div>
              <span>{visualLabel}</span>
              <span className="visual-stamp" aria-hidden="true"><ArrowUpRight size={16} /></span>
            </div>
            <div className="featured-card-body">
              <span className="content-category">{category}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const benefits = [
  {
    title: "One Account, Multiple Roles",
    description: "Access different services through one unified platform.",
    icon: UsersRound,
    color: "benefit-blue",
  },
  {
    title: "Everything in One Place",
    description: "Discover useful digital services without switching between unrelated platforms.",
    icon: Layers3,
    color: "benefit-purple",
  },
  {
    title: "Built for Everyone",
    description: "A connected digital experience for individuals, professionals, and businesses.",
    icon: Heart,
    color: "benefit-rose",
  },
];

export function BenefitsSection() {
  return (
    <section className="benefits-section" id="why-omnihub">
      <div className="benefits-inner">
        <div className="benefits-intro">
          <span className="section-kicker">THE OMNIHUB DIFFERENCE</span>
          <h2>Everything Connected.<br /><span>One Simple Experience.</span></h2>
          <p>
            Less jumping between apps. More time for what matters. OmniHub
            brings your digital life together in a way that just makes sense.
          </p>
          <Link className="text-link" href="#explore">
            Explore the platform <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="benefit-cards">
          {benefits.map(({ title, description, icon: Icon, color }) => (
            <article className="benefit-card" key={title}>
              <span className={`benefit-icon ${color}`}>
                <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <Check className="benefit-check" size={18} aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const footerGroups = [
  {
    title: "Quick Links",
    links: [
      { label: "Home", href: "/" },
      { label: "About OmniHub", href: "#why-omnihub" },
      { label: "What's possible", href: "#discover" },
      { label: "Contact", href: "mailto:hello@omnihub.example" },
    ],
  },
  {
    title: "Explore Features",
    links: [
      { label: "Shopping", href: "/ecommerce" },
      { label: "Jobs & Careers", href: "/jobs" },
      { label: "Learning", href: "/education" },
      { label: "AI Tools", href: "/ai" },
    ],
  },
  {
    title: "Help & Support",
    links: [
      { label: "Help Center", href: "#footer" },
      { label: "Privacy Policy", href: "#footer" },
      { label: "Terms & Conditions", href: "#footer" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer" id="footer">
      <div className="footer-inner">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand light />
            <p className="footer-tagline">One Platform. Endless Possibilities.</p>
            <p className="footer-description">
              A connected platform for the things you do, the people you meet,
              and the goals you reach.
            </p>
            <div className="social-links" aria-label="Social media">
              <a href="https://www.linkedin.com" aria-label="LinkedIn"><span>in</span></a>
              <a href="https://www.instagram.com" aria-label="Instagram"><span>ig</span></a>
              <a href="https://www.youtube.com" aria-label="YouTube"><span>yt</span></a>
            </div>
          </div>
          {footerGroups.map(({ title, links }) => (
            <div className="footer-column" key={title}>
              <h3>{title}</h3>
              <ul>
                {links.map(({ label, href }) => (
                  <li key={label}><Link href={href}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>© 2026 OmniHub. All rights reserved.</p>
          <p><ShieldCheck size={15} aria-hidden="true" /> Built around a better-connected world</p>
        </div>
      </div>
    </footer>
  );
}
