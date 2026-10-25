"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, Check, Clock3,
  ExternalLink, MapPin, Search, Share2, SlidersHorizontal, Users, Bookmark,
} from "lucide-react";
import defaultJobs from "@/data/defaultJobs";
import { apiRequest } from "@/features/ecommerce/api";
import styles from "./jobs.module.css";

type Company = string | { _id?: string; name: string; logoUrl?: string; website?: string; description?: string; city?: string; country?: string; industry?: string; verified?: boolean };
type Job = {
  _id?: string; id?: string; title: string; company: Company; companyLogo?: string; category: string;
  city: string; country: string; location?: string; workMode: string; type: string; experience: string;
  salaryMin?: number | null; salaryMax?: number | null; currency?: string; postedAt?: string; createdAt?: string;
  skills: string[]; description: string; responsibilities?: string[]; qualifications?: string[];
  benefits?: string[]; deadline?: string; featured?: boolean; demo?: boolean; status?: string;
};
type Application = { _id: string; status: string; createdAt: string; job: Job };
type Interview = { _id: string; startsAt: string; meetingUrl?: string; application: Application };
type EmployerApplication = { _id: string; status: string; applicant?: { name: string; email: string }; resumeUrl?: string };
type CandidateProfile = { headline?: string; summary?: string; skills?: string[]; linkedInUrl?: string; portfolioUrl?: string };
type EmployerProposal = { _id: string; status: string; coverLetter: string; bidAmount: number; freelancer?: { name: string; email: string } };
type FreelanceProject = { _id: string; title: string; status: string; description: string; duration: string; rateType?: string; budgetMin?: number; budgetMax?: number; skills?: string[]; company?: Company };
type FreelancerProposal = { _id: string; status: string; bidAmount: number; createdAt: string; project: FreelanceProject };
type Profile = { headline?: string; summary?: string; skills?: string[]; experience?: { title?: string }[]; education?: { title?: string }[]; certifications?: string[]; resumeUrl?: string; linkedInUrl?: string; portfolioUrl?: string };
type Saved = { _id: string; job: Job };
type ListingResponse = { jobs: Job[]; pagination?: { total: number; pages: number } };

const demoJobs = defaultJobs as Job[];
const categories = [
  "Web Development", "Software Engineering", "Frontend Development", "Backend Development",
  "Full Stack Development", "UI/UX Design", "Graphic Design", "Digital Marketing", "SEO",
  "Data Science", "AI & Machine Learning", "Customer Support", "Sales & Marketing",
  "Finance & Accounting", "Human Resources", "Other Jobs",
];
const workModes = ["Remote", "Hybrid", "On-site"];
const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const experienceLevels = ["Entry-level", "Mid-level", "Senior-level"];

function idFor(job: Job) {
  return job._id || job.id || "";
}

function isDemo(job: Job) {
  return job.demo === true || idFor(job).startsWith("demo-job-");
}

function companyName(job: Job) {
  return typeof job.company === "string" ? job.company : job.company?.name || "Company";
}

function companyLogo(job: Job) {
  return typeof job.company === "string" ? job.companyLogo : job.company?.logoUrl;
}

function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return "Salary not listed";
  const format = (amount: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(amount);
  const range = job.salaryMin && job.salaryMax
    ? `${format(job.salaryMin)} – ${format(job.salaryMax)}`
    : format((job.salaryMin || job.salaryMax) as number);
  return `${job.currency || "USD"} ${range}${job.type === "Freelance" ? "/hr" : "/yr"}`;
}

function postedLabel(job: Job) {
  const date = new Date(job.postedAt || job.createdAt || Date.now());
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  return days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
}

function readDemoSaves() {
  try {
    const saved = JSON.parse(localStorage.getItem("omnihub-demo-saved-jobs") || "[]");
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function Shell({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>
    <header className={styles.header}>
      <Link className={styles.brand} href="/"><span className={styles.brandMark}>o</span><span>OmniHub</span><b>Jobs</b></Link>
      <nav className={styles.navigation} aria-label="Main navigation">
        <Link href="/jobs">Jobs</Link><a href="/jobs#companies">Companies</a><a href="/jobs#resources">Career Resources</a><Link href="/jobs/dashboard">My dashboard</Link>
      </nav>
      <div className={styles.accountLinks}><Link href="/login">Log in</Link><Link className={styles.register} href="/register">Register</Link></div>
    </header>
    {children}
    <footer className={styles.footer}>
      <Link className={styles.brand} href="/jobs"><span className={styles.brandMark}>o</span><span>OmniHub</span><b>Jobs</b></Link>
      <p>Helping people find work that matters.</p>
      <nav aria-label="Footer navigation"><a href="/jobs#about">About</a><a href="mailto:careers@omnihub.example">Contact</a><a href="/jobs#privacy">Privacy Policy</a><a href="/jobs#terms">Terms</a><a href="mailto:help@omnihub.example">Help Center</a></nav>
    </footer>
  </div>;
}

function CompanyMark({ job, compact = false }: { job: Job; compact?: boolean }) {
  const logo = companyLogo(job);
  return <span className={`${styles.companyMark} ${compact ? styles.companyMarkCompact : ""}`}>
    {logo?.startsWith("http") ? <img src={logo} alt="" /> : <span>{logo || companyName(job).slice(0, 1)}</span>}
  </span>;
}

function JobCard({ job, onSave, saved }: { job: Job; onSave: (job: Job) => void; saved?: boolean }) {
  return <article className={styles.jobCard}>
    <CompanyMark job={job} />
    <div className={styles.jobCardCopy}>
      <Link href={`/jobs/${idFor(job)}`} className={styles.jobTitle}>{job.title}</Link>
      <span className={styles.companyName}>{companyName(job)}</span>
      {isDemo(job) && <span className={styles.demoBadge}>Sample listing</span>}
      <div className={styles.jobMeta}><span><MapPin size={13} />{job.location || [job.city, job.country].filter(Boolean).join(", ")}</span><span>{job.workMode}</span><span>{job.type}</span></div>
      <div className={styles.jobCardBottom}><strong>{formatSalary(job)}</strong><span><Clock3 size={12} /> {postedLabel(job)}</span></div>
    </div>
    <button className={`${styles.saveIcon} ${saved ? styles.isSaved : ""}`} onClick={() => onSave(job)} aria-label={saved ? `Unsave ${job.title}` : `Save ${job.title}`}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button>
    <Link className={styles.cardApply} href={`/jobs/${idFor(job)}`}>View job</Link>
  </article>;
}

function useToast() {
  const [toast, setToast] = useState("");
  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }, []);
  return { toast, notify };
}

export function JobsHome() {
  const [filters, setFilters] = useState({ q: "", city: "", category: "", type: "", workMode: "", experience: "", minSalary: "", maxSalary: "", postedWithin: "", company: "", sort: "" });
  const [liveJobs, setLiveJobs] = useState<Job[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [loadedApiPage, setLoadedApiPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [savedDemo, setSavedDemo] = useState<string[]>([]);
  const [savedLive, setSavedLive] = useState<string[]>([]);
  const [freelanceProjects, setFreelanceProjects] = useState<FreelanceProject[]>([]);
  const [freelanceError, setFreelanceError] = useState("");
  const { toast, notify } = useToast();

  useEffect(() => {
    setSavedDemo(readDemoSaves());
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ limit: "50", page: "1" });
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    void apiRequest<ListingResponse>(`/jobs?${params.toString()}`)
      .then((result) => { if (active) { setLiveJobs(result.jobs); setLoadedApiPage(1); setLiveTotal(result.pagination?.total ?? result.jobs.length); setApiError(""); } })
      .catch((reason: unknown) => { if (active) { setLiveJobs([]); setLoadedApiPage(1); setLiveTotal(0); setApiError(reason instanceof Error ? reason.message : "Live listings are temporarily unavailable."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);
  useEffect(() => {
    void apiRequest<{ projects: FreelanceProject[] }>("/jobs/freelance?limit=6")
      .then((result) => setFreelanceProjects(result.projects))
      .catch((reason: unknown) => setFreelanceError(reason instanceof Error ? reason.message : "Freelance projects are temporarily unavailable."));
  }, []);

  const filteredDemo = useMemo(() => demoJobs.filter((job) => {
    const term = filters.q.trim().toLowerCase();
    const searchable = [job.title, job.category, job.description, job.company, ...job.skills].join(" ").toLowerCase();
    return (!term || searchable.includes(term)) &&
      (!filters.city || `${job.city} ${job.country}`.toLowerCase().includes(filters.city.toLowerCase())) &&
      (!filters.category || job.category === filters.category) &&
      (!filters.type || job.type === filters.type) &&
      (!filters.workMode || job.workMode === filters.workMode) &&
      (!filters.experience || job.experience === filters.experience) &&
      (!filters.company || companyName(job).toLowerCase().includes(filters.company.toLowerCase())) &&
      (!filters.minSalary || (job.salaryMax || 0) >= Number(filters.minSalary)) &&
      (!filters.maxSalary || (job.salaryMin || job.salaryMax || 0) <= Number(filters.maxSalary)) &&
      (!filters.postedWithin || new Date(job.postedAt || "").getTime() >= Date.now() - Number(filters.postedWithin) * 86400000);
  }), [filters]);
  const allJobs = useMemo(() => {
    const combined = [...liveJobs, ...filteredDemo];
    if (filters.sort === "salary") combined.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    else if (filters.sort === "oldest") combined.sort((a, b) => new Date(a.postedAt || a.createdAt || 0).getTime() - new Date(b.postedAt || b.createdAt || 0).getTime());
    else combined.sort((a, b) => Number(b.featured) - Number(a.featured));
    return combined;
  }, [liveJobs, filteredDemo, filters.sort]);
  const pageCount = Math.max(1, Math.ceil(allJobs.length / 12));
  const visibleJobs = allJobs.slice((page - 1) * 12, page * 12);
  const updateFilter = (key: keyof typeof filters, value: string) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); };
  const clearFilters = () => { setFilters({ q: "", city: "", category: "", type: "", workMode: "", experience: "", minSalary: "", maxSalary: "", postedWithin: "", company: "", sort: "" }); setPage(1); };

  async function saveJob(job: Job) {
    const id = idFor(job);
    if (isDemo(job)) {
      const next = savedDemo.includes(id) ? savedDemo.filter((saved) => saved !== id) : [...savedDemo, id];
      setSavedDemo(next);
      localStorage.setItem("omnihub-demo-saved-jobs", JSON.stringify(next));
      notify(next.includes(id) ? "Demo job saved on this device." : "Demo job removed from saved jobs.");
      return;
    }
    try {
      if (savedLive.includes(id)) await apiRequest(`/jobs/${id}/save`, { method: "DELETE" });
      else await apiRequest(`/jobs/${id}/save`, { method: "PUT" });
      setSavedLive((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]);
      notify(savedLive.includes(id) ? "Job removed from saved jobs." : "Job saved to your account.");
    } catch (reason) { notify(reason instanceof Error ? `${reason.message} Sign in to save jobs.` : "Please sign in to save jobs."); }
  }
  async function loadMoreLiveJobs() {
    setLoadingMore(true);
    const params = new URLSearchParams({ limit: "50", page: String(loadedApiPage + 1) });
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    try {
      const result = await apiRequest<ListingResponse>(`/jobs?${params.toString()}`);
      setLiveJobs((current) => [...current, ...result.jobs]);
      setLoadedApiPage((current) => current + 1);
      setLiveTotal(result.pagination?.total ?? liveTotal);
    } catch (reason) {
      setApiError(reason instanceof Error ? reason.message : "More live listings could not be loaded.");
    } finally { setLoadingMore(false); }
  }

  return <Shell>
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>Find your <span>dream job.</span></h1>
          <p>Discover meaningful opportunities from teams that are ready to grow with you.</p>
          <form className={styles.searchBar} onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
            <label><Search size={18} /><input value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Job title, skills, or company" aria-label="Search job title, skills, or company" /></label>
            <label><MapPin size={18} /><input value={filters.city} onChange={(event) => updateFilter("city", event.target.value)} placeholder="City or country" aria-label="Search location" /></label>
            <button type="submit"><Search size={16} /> Find jobs</button>
          </form>
          <div className={styles.quickFilters}>
            <label><BriefcaseBusiness size={15} /><select aria-label="Job type" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}><option value="">Any job type</option>{jobTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><MapPin size={15} /><select aria-label="Work arrangement" value={filters.workMode} onChange={(event) => updateFilter("workMode", event.target.value)}><option value="">Any workplace</option>{workModes.map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
          <span className={styles.demoNotice}>Sample positions are clearly labeled demo listings. Live roles are loaded from OmniHub.</span>
        </div>
        <div className={styles.heroArt} aria-hidden="true"><div><BriefcaseBusiness size={53} /><span>Make your next move</span></div><i /><b /></div>
      </section>
      <section className={styles.contentSection} id="featured">
        <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>HAND-PICKED OPPORTUNITIES</span><h2>Featured jobs</h2></div><a href="#latest">Explore all jobs <ArrowRight size={15} /></a></div>
        <div className={styles.featuredGrid}>{[...demoJobs.filter((job) => job.featured).slice(0, 3), ...liveJobs.filter((job) => job.featured).slice(0, 3)].slice(0, 3).map((job) => <JobCard key={idFor(job)} job={job} onSave={saveJob} saved={isDemo(job) ? savedDemo.includes(idFor(job)) : savedLive.includes(idFor(job))} />)}</div>
      </section>

      <section className={styles.contentSection} id="latest">
        <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>NEW OPPORTUNITIES</span><h2>Latest jobs</h2><p>Find a role that fits your skills, goals, and the way you want to work.</p></div><span className={styles.resultCount}>{filteredDemo.length + liveTotal} results</span></div>
        <div className={styles.filterPanel}>
          <label><span>Category</span><select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}><option value="">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Experience</span><select value={filters.experience} onChange={(event) => updateFilter("experience", event.target.value)}><option value="">Any experience</option>{experienceLevels.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Company</span><input value={filters.company} onChange={(event) => updateFilter("company", event.target.value)} placeholder="Company name" /></label>
          <label><span>Posted</span><select value={filters.postedWithin} onChange={(event) => updateFilter("postedWithin", event.target.value)}><option value="">Any time</option><option value="1">Past 24 hours</option><option value="7">Past week</option><option value="30">Past month</option></select></label>
          <label><span>Min salary (USD)</span><input type="number" min="0" value={filters.minSalary} onChange={(event) => updateFilter("minSalary", event.target.value)} placeholder="Any" /></label>
          <label><span>Max salary (USD)</span><input type="number" min="0" value={filters.maxSalary} onChange={(event) => updateFilter("maxSalary", event.target.value)} placeholder="Any" /></label>
          <label><span>Sort by</span><select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><option value="">Most relevant</option><option value="salary">Highest salary</option><option value="oldest">Oldest first</option></select></label>
          <button className={styles.clearButton} onClick={clearFilters}><SlidersHorizontal size={14} /> Clear filters</button>
        </div>
        {apiError && <p className={styles.inlineNotice}>Showing demo jobs. Live listings could not be loaded: {apiError}</p>}
        {loading && <div className={styles.loading}>Loading live job listings…</div>}
        {!loading && visibleJobs.length > 0 && <div className={styles.jobList}>{visibleJobs.map((job) => <JobCard key={idFor(job)} job={job} onSave={saveJob} saved={isDemo(job) ? savedDemo.includes(idFor(job)) : savedLive.includes(idFor(job))} />)}</div>}
        {!loading && visibleJobs.length === 0 && <div className={styles.empty}><Search size={26} /><h3>No jobs match your filters</h3><p>Try another keyword or clear your filters to see more roles.</p><button className={styles.outlineButton} onClick={clearFilters}>Clear filters</button></div>}
        {pageCount > 1 && <div className={styles.pagination}><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={14} /> Previous</button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next <ArrowRight size={14} /></button></div>}
        {liveJobs.length < liveTotal && <button className={styles.loadMore} disabled={loadingMore} onClick={() => void loadMoreLiveJobs()}>{loadingMore ? "Loading…" : "Load more live jobs"} <ArrowRight size={14} /></button>}
      </section>

      <section className={styles.contentSection} id="categories">
        <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>EXPLORE YOUR POSSIBILITIES</span><h2>Popular job categories</h2></div></div>
        <div className={styles.categoryGrid}>{categories.slice(0, 12).map((category) => <button key={category} onClick={() => { updateFilter("category", category); document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" }); }}><span><BriefcaseBusiness size={17} /></span><strong>{category}</strong><ArrowRight size={14} /></button>)}</div>
      </section>

      <section className={`${styles.contentSection} ${styles.companySection}`} id="companies">
        <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>GOOD PEOPLE, GOOD WORK</span><h2>Top hiring companies</h2></div></div>
        <div className={styles.companyGrid}>{[...new Set([...demoJobs.map(companyName), ...liveJobs.map(companyName)])].slice(0, 8).map((name) => <button key={name} onClick={() => { updateFilter("company", name); document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" }); }}><span>{name.slice(0, 1)}</span><strong>{name}</strong><small>Explore opportunities <ArrowRight size={12} /></small></button>)}</div>
      </section>

      <section className={styles.remoteSection}>
        <div><span className={styles.eyebrow}>WORK FROM ANYWHERE</span><h2>Remote jobs for a flexible future.</h2><p>Find teams that value great work, wherever you do it.</p></div>
        <button onClick={() => { updateFilter("workMode", "Remote"); document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" }); }}>Explore remote roles <ArrowRight size={15} /></button>
      </section>

      <section className={styles.contentSection} id="freelance">
        <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>INDEPENDENT OPPORTUNITIES</span><h2>Freelance &amp; contract projects</h2><p>Project engagements are listed separately from full-time jobs.</p></div></div>
        {freelanceProjects.length ? <div className={styles.jobList}>{freelanceProjects.map((project) => <article className={styles.projectCard} key={project._id}><div><span className={styles.eyebrow}>{project.rateType || "Project"} · {project.duration}</span><h3>{project.title}</h3><p>{project.description}</p><div className={styles.skillList}>{(project.skills || []).slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div><strong>{project.budgetMin || project.budgetMax ? `${project.budgetMin ?? ""}${project.budgetMin && project.budgetMax ? " – " : ""}${project.budgetMax ?? ""} USD` : "Budget negotiable"}</strong></div><Link className={styles.outlineButton} href={`/jobs/freelance/${project._id}`}>View project <ArrowRight size={14} /></Link></article>)}</div> : <div className={styles.projectEmpty}><BriefcaseBusiness size={18} /><span>{freelanceError ? "Live projects are temporarily unavailable." : "No live freelance projects yet. Check back soon."}</span></div>}
      </section>

      <section className={styles.contentSection} id="resources">
        <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>GROW WITH CONFIDENCE</span><h2>Career resources</h2></div></div>
        <div className={styles.resourcesGrid}><article><span>01</span><h3>Make your resume work harder</h3><p>Simple ways to highlight your impact and tell a clear career story.</p><a href="mailto:careers@omnihub.example?subject=Resume%20guide">Explore guide <ArrowRight size={14} /></a></article><article><span>02</span><h3>Prepare for the interview</h3><p>Practical preparation to help you feel ready for your next conversation.</p><a href="mailto:careers@omnihub.example?subject=Interview%20guide">Explore guide <ArrowRight size={14} /></a></article><article><span>03</span><h3>Plan your next career move</h3><p>Turn your strengths and interests into a focused search strategy.</p><a href="mailto:careers@omnihub.example?subject=Career%20planning">Explore guide <ArrowRight size={14} /></a></article></div>
      </section>

      <section className={styles.employerCta}><div><span className={styles.eyebrow}>FOR EMPLOYERS</span><h2>Meet the people who move your business forward.</h2><p>Reach thoughtful, motivated candidates with an OmniHub Jobs listing.</p></div><Link href="/jobs/employer">Post a job <ArrowRight size={15} /></Link></section>
      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </main>
  </Shell>;
}

export function JobDetails({ id }: { id: string }) {
  const demo = demoJobs.find((job) => idFor(job) === id);
  const [job, setJob] = useState<Job | null>(demo || null);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState("");
  const { toast, notify } = useToast();

  useEffect(() => {
    if (demo) return;
    let active = true;
    void apiRequest<{ job: Job }>(`/jobs/${id}`)
      .then((result) => { if (active) setJob(result.job); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Job details could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, demo]);

  async function apply() {
    if (!job || isDemo(job)) { notify("This is a sample listing. Sign in and apply to a live job to submit an application."); return; }
    try {
      await apiRequest(`/jobs/${id}/apply`, { method: "POST", body: JSON.stringify({}) });
      notify("Application submitted successfully.");
    } catch (reason) { notify(reason instanceof Error ? reason.message : "Your application could not be submitted."); }
  }

  async function save() {
    if (!job) return;
    if (isDemo(job)) {
      const current = JSON.parse(localStorage.getItem("omnihub-demo-saved-jobs") || "[]") as string[];
      const next = current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id];
      localStorage.setItem("omnihub-demo-saved-jobs", JSON.stringify(next));
      notify(next.includes(id) ? "Demo job saved on this device." : "Demo job removed from saved jobs.");
      return;
    }
    try { await apiRequest(`/jobs/${id}/save`, { method: "PUT" }); notify("Job saved to your account."); }
    catch (reason) { notify(reason instanceof Error ? reason.message : "Please sign in to save jobs."); }
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: job?.title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); notify("Job link copied."); }
    } catch (reason) {
      if (reason instanceof Error && reason.name !== "AbortError") notify("Could not share this job.");
    }
  }

  if (loading) return <Shell><main className={styles.dashboardPage}><p className={styles.loading}>Loading job details…</p></main></Shell>;
  if (error || !job) return <Shell><main className={styles.dashboardPage}><div className={styles.empty}><h2>Job not found</h2><p>{error || "This job may have closed or been removed."}</p><Link className={styles.outlineButton} href="/jobs">Back to jobs</Link></div></main></Shell>;
  const similar = demoJobs.filter((candidate) => candidate.category === job.category && idFor(candidate) !== id).slice(0, 3);
  return <Shell><main className={styles.detailPage}>
    <Link href="/jobs" className={styles.backLink}><ArrowLeft size={15} /> Back to jobs</Link>
    <section className={styles.detailHeader}><CompanyMark job={job} /><div><span className={styles.eyebrow}>{job.category}</span><h1>{job.title}</h1><p>{companyName(job)} · {job.location || `${job.city}, ${job.country}`}</p></div><button className={styles.outlineButton} onClick={share}><Share2 size={15} /> Share job</button></section>
    <div className={styles.detailLayout}><article className={styles.detailBody}>
      <div className={styles.detailFacts}><span><BriefcaseBusiness size={15} />{job.type}</span><span><MapPin size={15} />{job.workMode}</span><span><Users size={15} />{job.experience}</span><span><CalendarDays size={15} />Posted {postedLabel(job)}</span></div>
      <h2>About the role</h2><p>{job.description}</p>
      <h2>Responsibilities</h2><ul>{(job.responsibilities || []).map((item) => <li key={item}>{item}</li>)}</ul>
      <h2>Qualifications</h2><ul>{(job.qualifications || []).map((item) => <li key={item}>{item}</li>)}</ul>
      <h2>Skills</h2><div className={styles.skillList}>{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
      <h2>Benefits</h2><ul>{(job.benefits || []).map((item) => <li key={item}>{item}</li>)}</ul>
      {job.deadline && <p className={styles.deadline}>Application deadline: {new Date(job.deadline).toLocaleDateString()}</p>}
    </article><aside className={styles.applyPanel}><h2>Ready to apply?</h2><strong>{formatSalary(job)}</strong><p>Applications are reviewed directly by the hiring company.</p><button className={styles.primaryButton} onClick={apply}>Apply now <ArrowRight size={15} /></button><button className={styles.outlineButton} onClick={save}><Bookmark size={15} /> Save job</button><hr/><h3>About {companyName(job)}</h3><p>{typeof job.company === "object" ? job.company.description || `${companyName(job)} is hiring for ${job.category} roles.` : `${companyName(job)} is an employer on OmniHub Jobs.`}</p>{typeof job.company === "object" && job.company.website && <a href={job.company.website} target="_blank" rel="noreferrer">Company website <ExternalLink size={13} /></a>}</aside></div>
    {!!similar.length && <section className={styles.similarJobs}><h2>Similar jobs</h2>{similar.map((candidate) => <JobCard key={idFor(candidate)} job={candidate} onSave={() => undefined} />)}</section>}
    {toast && <div className={styles.toast} role="status">{toast}</div>}
  </main></Shell>;
}

export function FreelanceDetails({ id }: { id: string }) {
  const [project, setProject] = useState<FreelanceProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast, notify } = useToast();
  useEffect(() => {
    let active = true;
    void apiRequest<{ project: FreelanceProject }>(`/jobs/freelance/${id}`)
      .then((result) => { if (active) setProject(result.project); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Project could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  async function submitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      await apiRequest(`/jobs/freelance/${id}/proposals`, { method: "POST", body: JSON.stringify({ coverLetter, bidAmount: Number(bidAmount), portfolioUrl }) });
      setCoverLetter(""); notify("Your proposal has been submitted.");
    } catch (reason) { notify(reason instanceof Error ? reason.message : "Proposal could not be submitted."); }
    finally { setBusy(false); }
  }
  return <Shell><main className={styles.detailPage}>
    <Link href="/jobs#freelance" className={styles.backLink}><ArrowLeft size={15} /> Back to freelance projects</Link>
    {loading ? <p className={styles.loading}>Loading project…</p> : !project ? <div className={styles.empty}><h2>Project not found</h2><p>{error || "This project is no longer accepting proposals."}</p></div> : <>
      <section className={styles.detailHeader}><CompanyMark job={{ title: project.title, company: project.company || "OmniHub employer", category: "Freelance", city: "", country: "", type: "Freelance", workMode: "Remote", experience: "Mid-level", skills: [], description: project.description }} /><div><span className={styles.eyebrow}>FREELANCE PROJECT · {project.duration}</span><h1>{project.title}</h1><p>{typeof project.company === "string" ? project.company : project.company?.name || "OmniHub employer"}</p></div></section>
      <div className={styles.detailLayout}><article className={styles.detailBody}><h2>Project details</h2><p>{project.description}</p><h2>Required skills</h2><div className={styles.skillList}>{(project.skills || []).map((skill) => <span key={skill}>{skill}</span>)}</div><h2>Engagement</h2><p>{project.rateType || "Project"} · {project.duration}</p><strong>{project.budgetMin || project.budgetMax ? `${project.budgetMin ?? ""}${project.budgetMin && project.budgetMax ? " – " : ""}${project.budgetMax ?? ""} USD` : "Budget negotiable"}</strong></article>
        <aside className={styles.applyPanel}><h2>Submit a proposal</h2><form className={styles.profileForm} onSubmit={submitProposal}><label>Proposal<textarea required maxLength={5000} rows={5} value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} placeholder="Introduce yourself and explain how you would approach this project." /></label><label>Your bid<input type="number" min="0" required value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} /></label><label>Portfolio URL<input type="url" value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://" /></label><button className={styles.primaryButton} disabled={busy}>{busy ? "Submitting…" : "Submit proposal"} <ArrowRight size={14} /></button></form></aside>
      </div>
    </>}
    {toast && <div className={styles.toast} role="status">{toast}</div>}
  </main></Shell>;
}

export function SeekerDashboard() {
  const [profile, setProfile] = useState<Profile>({});
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [proposals, setProposals] = useState<FreelancerProposal[]>([]);
  const [savedJobs, setSavedJobs] = useState<Saved[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast, notify } = useToast();
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [profileResult, applicationsResult, savedResult, interviewResult, proposalResult] = await Promise.all([
        apiRequest<{ profile: Profile | null }>("/jobs/profile"),
        apiRequest<{ applications: Application[] }>("/jobs/applications/mine"),
        apiRequest<{ savedJobs: Saved[] }>("/jobs/saved"),
        apiRequest<{ interviews: Interview[] }>("/jobs/interviews/mine"),
        apiRequest<{ proposals: FreelancerProposal[] }>("/jobs/proposals/mine"),
      ]);
      setProfile(profileResult.profile || {});
      setApplications(applicationsResult.applications);
      setInterviews(interviewResult.interviews);
      setProposals(proposalResult.proposals);
      const demoSavedIds = readDemoSaves();
      setSavedJobs([
        ...savedResult.savedJobs,
        ...demoJobs.filter((job) => demoSavedIds.includes(idFor(job))).map((job) => ({ _id: idFor(job), job })),
      ]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Sign in to access your job dashboard."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    try { await apiRequest("/jobs/profile", { method: "PUT", body: JSON.stringify(profile) }); notify("Your profile has been saved."); }
    catch (reason) { notify(reason instanceof Error ? reason.message : "Profile could not be saved."); }
    finally { setSaving(false); }
  }
  async function withdraw(id: string) {
    try { await apiRequest(`/jobs/applications/${id}`, { method: "DELETE" }); await reload(); notify("Application withdrawn."); }
    catch (reason) { notify(reason instanceof Error ? reason.message : "Application could not be withdrawn."); }
  }
  const completion = Math.round(([profile.headline, profile.summary, profile.skills?.length, profile.experience?.length, profile.education?.length, profile.certifications?.length, profile.resumeUrl, profile.linkedInUrl].filter(Boolean).length / 8) * 100);
  return <Shell><main className={styles.dashboardPage}><div className={styles.dashboardHeading}><div><span className={styles.eyebrow}>YOUR CAREER SPACE</span><h1>Job seeker dashboard</h1></div><Link className={styles.outlineButton} href="/jobs">Browse jobs <ArrowRight size={14} /></Link></div>
    {error && <p className={styles.inlineNotice}>{error} <Link href="/login">Sign in</Link></p>}
    {loading ? <p className={styles.loading}>Loading your dashboard…</p> : <>
      <div className={styles.completionCard}><span>Profile completion</span><strong>{completion}%</strong><div><i style={{ width: `${completion}%` }} /></div><small>A complete profile helps employers understand your experience.</small></div>
      <div className={styles.dashboardGrid}>
        <section className={styles.panel}><h2>Your professional profile</h2><form onSubmit={saveProfile} className={styles.profileForm}>
          <label>Professional headline<input maxLength={160} value={profile.headline || ""} onChange={(event) => setProfile({ ...profile, headline: event.target.value })} placeholder="e.g. Frontend engineer focused on accessible UI" /></label>
          <label>Summary<textarea maxLength={5000} rows={4} value={profile.summary || ""} onChange={(event) => setProfile({ ...profile, summary: event.target.value })} placeholder="Share a short introduction and what you are looking for." /></label>
          <label>Skills, separated by commas<input value={profile.skills?.join(", ") || ""} onChange={(event) => setProfile({ ...profile, skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 50) })} placeholder="React, TypeScript, UX" /></label>
          <label>Work experience, one role per line<textarea rows={3} value={profile.experience?.map((item) => item.title || "").join("\n") || ""} onChange={(event) => setProfile({ ...profile, experience: event.target.value.split("\n").map((title) => title.trim()).filter(Boolean).slice(0, 20).map((title) => ({ title })) })} placeholder="Frontend developer · Example Co. · 2022–2025" /></label>
          <label>Education, one qualification per line<textarea rows={2} value={profile.education?.map((item) => item.title || "").join("\n") || ""} onChange={(event) => setProfile({ ...profile, education: event.target.value.split("\n").map((title) => title.trim()).filter(Boolean).slice(0, 20).map((title) => ({ title })) })} placeholder="BSc Computer Science · University" /></label>
          <label>Certifications, separated by commas<input value={profile.certifications?.join(", ") || ""} onChange={(event) => setProfile({ ...profile, certifications: event.target.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30) })} placeholder="AWS Certified, Scrum Master" /></label>
          <label>Resume URL<input type="url" value={profile.resumeUrl || ""} onChange={(event) => setProfile({ ...profile, resumeUrl: event.target.value })} placeholder="https://" /></label>
          <label>LinkedIn URL<input type="url" value={profile.linkedInUrl || ""} onChange={(event) => setProfile({ ...profile, linkedInUrl: event.target.value })} placeholder="https://" /></label>
          <label>Portfolio URL<input type="url" value={profile.portfolioUrl || ""} onChange={(event) => setProfile({ ...profile, portfolioUrl: event.target.value })} placeholder="https://" /></label>
          <button className={styles.primaryButton} disabled={saving}>{saving ? "Saving…" : "Save profile"} <Check size={15} /></button>
        </form></section>
        <section className={styles.panel}><h2>Applications <span className={styles.countBadge}>{applications.length}</span></h2>
          {applications.length ? <div className={styles.applicationList}>{applications.map((application) => <article key={application._id}><div><Link href={`/jobs/${idFor(application.job)}`}>{application.job?.title || "Job listing"}</Link><span>{companyName(application.job)} · Applied {new Date(application.createdAt).toLocaleDateString()}</span></div><span className={styles.statusBadge}>{application.status}</span>{["Applied", "Under Review"].includes(application.status) && <button onClick={() => void withdraw(application._id)}>Withdraw</button>}</article>)}</div> : <p className={styles.muted}>Your submitted applications will appear here.</p>}
        </section>
        <section className={styles.panel}><h2>Saved jobs <span className={styles.countBadge}>{savedJobs.length}</span></h2>
          {savedJobs.length ? <div className={styles.applicationList}>{savedJobs.map(({ _id, job }) => <article key={_id}><div><Link href={`/jobs/${idFor(job)}`}>{job.title}</Link><span>{companyName(job)} · {job.location || `${job.city}, ${job.country}`}</span></div><Link href={`/jobs/${idFor(job)}`} className={styles.textLink}>View job</Link></article>)}</div> : <p className={styles.muted}>Save roles you would like to revisit.</p>}
        </section>
        <section className={styles.panel}><h2>Interview invitations <span className={styles.countBadge}>{interviews.length}</span></h2>
          {interviews.length ? <div className={styles.applicationList}>{interviews.map((interview) => <article key={interview._id}><div><strong>{interview.application?.job?.title || "Interview"}</strong><span>{interview.application ? companyName(interview.application.job) : "OmniHub employer"} · {new Date(interview.startsAt).toLocaleString()}</span></div>{interview.meetingUrl && <a href={interview.meetingUrl} target="_blank" rel="noreferrer">Join interview <ExternalLink size={12} /></a>}</article>)}</div> : <p className={styles.muted}>Interview invitations will appear here.</p>}
        </section>
        <section className={styles.panel}><h2>Freelance proposals <span className={styles.countBadge}>{proposals.length}</span></h2>
          {proposals.length ? <div className={styles.applicationList}>{proposals.map((proposal) => <article key={proposal._id}><div><strong>{proposal.project.title}</strong><span>Bid {proposal.bidAmount} · Submitted {new Date(proposal.createdAt).toLocaleDateString()}</span></div><span className={styles.statusBadge}>{proposal.status}</span></article>)}</div> : <p className={styles.muted}>Submitted project proposals will appear here.</p>}
        </section>
      </div>
    </>}
    {toast && <div className={styles.toast} role="status">{toast}</div>}
  </main></Shell>;
}

export function EmployerDashboard() {
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyDraft, setCompanyDraft] = useState({ logoUrl: "", website: "", industry: "", city: "", country: "" });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Record<string, (EmployerApplication & { candidateProfile?: CandidateProfile | null })[]>>({});
  const [projects, setProjects] = useState<FreelanceProject[]>([]);
  const [proposals, setProposals] = useState<Record<string, EmployerProposal[]>>({});
  const [companyReady, setCompanyReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast, notify } = useToast();
  const [draft, setDraft] = useState({ title: "", category: "Web Development", description: "", country: "Bangladesh", city: "", workMode: "Remote", type: "Full-time", experience: "Mid-level", salaryMin: "", salaryMax: "", skills: "" });
  const [projectDraft, setProjectDraft] = useState({ title: "", description: "", skills: "", rateType: "Fixed", duration: "2–4 weeks", budgetMin: "", budgetMax: "" });
  const reload = useCallback(async () => {
    try {
      const [companyResult, jobResult, projectResult] = await Promise.all([
        apiRequest<{ company: { name: string; description?: string; logoUrl?: string; website?: string; industry?: string; city?: string; country?: string } | null }>("/jobs/company/mine"),
        apiRequest<{ jobs: Job[] }>("/jobs/mine"),
        apiRequest<{ projects: FreelanceProject[] }>("/jobs/freelance/mine"),
      ]);
      setCompanyReady(Boolean(companyResult.company));
      setCompanyNameInput(companyResult.company?.name || "");
      setCompanyDescription(companyResult.company?.description || "");
      setCompanyDraft({
        logoUrl: companyResult.company?.logoUrl || "",
        website: companyResult.company?.website || "",
        industry: companyResult.company?.industry || "",
        city: companyResult.company?.city || "",
        country: companyResult.company?.country || "",
      });
      setJobs(jobResult.jobs);
      setProjects(projectResult.projects);
      const rows = await Promise.all(jobResult.jobs.map(async (job) => {
        const result = await apiRequest<{ applications: (EmployerApplication & { candidateProfile?: CandidateProfile | null })[] }>(`/jobs/${idFor(job)}/applications`);
        return [idFor(job), result.applications] as const;
      }));
      setApplications(Object.fromEntries(rows));
      const proposalRows = await Promise.all(projectResult.projects.map(async (project) => {
        const result = await apiRequest<{ proposals: EmployerProposal[] }>(`/jobs/freelance/${project._id}/proposals`);
        return [project._id, result.proposals] as const;
      }));
      setProposals(Object.fromEntries(proposalRows));
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Sign in with an approved employer account to manage listings."); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      await apiRequest("/jobs/company", { method: "POST", body: JSON.stringify({ name: companyNameInput, description: companyDescription, ...companyDraft }) });
      setCompanyReady(true); notify("Company profile saved.");
    } catch (reason) { notify(reason instanceof Error ? reason.message : "Company profile could not be saved."); }
    finally { setBusy(false); }
  }
  async function createJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const body = { ...draft, salaryMin: draft.salaryMin ? Number(draft.salaryMin) : null, salaryMax: draft.salaryMax ? Number(draft.salaryMax) : null, skills: draft.skills.split(",").map((skill) => skill.trim()).filter(Boolean) };
    try {
      await apiRequest("/jobs", { method: "POST", body: JSON.stringify(body) });
      setDraft({ ...draft, title: "", description: "", city: "", salaryMin: "", salaryMax: "", skills: "" });
      await reload(); notify("Job submitted for admin review.");
    } catch (reason) { notify(reason instanceof Error ? reason.message : "Job could not be created."); }
    finally { setBusy(false); }
  }
  async function changeStatus(applicationId: string, status: string) {
    try { await apiRequest(`/jobs/applications/${applicationId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); await reload(); notify(`Application updated to ${status}.`); }
    catch (reason) { notify(reason instanceof Error ? reason.message : "Application could not be updated."); }
  }
  async function closeJob(id: string) {
    try { await apiRequest(`/jobs/${id}/close`, { method: "PATCH", body: JSON.stringify({}) }); await reload(); notify("Job listing closed."); }
    catch (reason) { notify(reason instanceof Error ? reason.message : "Job could not be closed."); }
  }
  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      await apiRequest("/jobs/freelance", { method: "POST", body: JSON.stringify({
        ...projectDraft,
        skills: projectDraft.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        budgetMin: projectDraft.budgetMin ? Number(projectDraft.budgetMin) : null,
        budgetMax: projectDraft.budgetMax ? Number(projectDraft.budgetMax) : null,
      }) });
      setProjectDraft({ title: "", description: "", skills: "", rateType: "Fixed", duration: "2–4 weeks", budgetMin: "", budgetMax: "" });
      await reload(); notify("Freelance project submitted for review.");
    } catch (reason) { notify(reason instanceof Error ? reason.message : "Project could not be created."); }
    finally { setBusy(false); }
  }
  async function updateProposal(id: string, status: string) {
    try { await apiRequest(`/jobs/proposals/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); await reload(); notify(`Proposal updated to ${status}.`); }
    catch (reason) { notify(reason instanceof Error ? reason.message : "Proposal could not be updated."); }
  }
  async function scheduleInterview(applicationId: string) {
    const startsAt = window.prompt("Enter interview date and time (ISO format, e.g. 2026-11-01T14:00:00Z):");
    if (!startsAt) return;
    const meetingUrl = window.prompt("Optional meeting link:") || "";
    try {
      await apiRequest("/jobs/interviews", { method: "POST", body: JSON.stringify({ applicationId, startsAt, meetingUrl }) });
      await reload(); notify("Interview invitation scheduled.");
    } catch (reason) { notify(reason instanceof Error ? reason.message : "Interview could not be scheduled."); }
  }
  return <Shell><main className={styles.dashboardPage}><div className={styles.dashboardHeading}><div><span className={styles.eyebrow}>EMPLOYER WORKSPACE</span><h1>Employer dashboard</h1></div><Link href="/jobs">Browse jobs</Link></div>
    {error && <p className={styles.inlineNotice}>{error} <Link href="/register">Create an employer account</Link> (choose Seller during registration).</p>}
    <div className={styles.dashboardGrid}>
      <section className={styles.panel}><h2>Company profile</h2><form className={styles.profileForm} onSubmit={saveCompany}><label>Company name<input required maxLength={120} value={companyNameInput} onChange={(event) => setCompanyNameInput(event.target.value)} /></label><label>About the company<textarea rows={3} maxLength={5000} value={companyDescription} onChange={(event) => setCompanyDescription(event.target.value)} /></label><label>Company logo URL<input type="url" value={companyDraft.logoUrl} onChange={(event) => setCompanyDraft({ ...companyDraft, logoUrl: event.target.value })} placeholder="https://" /></label><label>Website<input type="url" value={companyDraft.website} onChange={(event) => setCompanyDraft({ ...companyDraft, website: event.target.value })} placeholder="https://" /></label><label>Industry<input maxLength={100} value={companyDraft.industry} onChange={(event) => setCompanyDraft({ ...companyDraft, industry: event.target.value })} /></label><div className={styles.formPair}><label>City<input maxLength={100} value={companyDraft.city} onChange={(event) => setCompanyDraft({ ...companyDraft, city: event.target.value })} /></label><label>Country<input maxLength={100} value={companyDraft.country} onChange={(event) => setCompanyDraft({ ...companyDraft, country: event.target.value })} /></label></div><button className={styles.primaryButton} disabled={busy}>{companyReady ? "Update company" : "Save company"} <Check size={14} /></button><small>New companies and job listings require admin approval before appearing publicly.</small></form></section>
      <section className={styles.panel}><h2>Post a job</h2><form className={styles.profileForm} onSubmit={createJob}>
        <label>Job title<input required maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label>Category<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Description<textarea required rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <div className={styles.formPair}><label>Country<input required value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} /></label><label>City<input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label></div>
        <div className={styles.formPair}><label>Work mode<select value={draft.workMode} onChange={(event) => setDraft({ ...draft, workMode: event.target.value })}>{workModes.map((value) => <option key={value}>{value}</option>)}</select></label><label>Job type<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{jobTypes.map((value) => <option key={value}>{value}</option>)}</select></label></div>
        <div className={styles.formPair}><label>Experience<select value={draft.experience} onChange={(event) => setDraft({ ...draft, experience: event.target.value })}>{experienceLevels.map((value) => <option key={value}>{value}</option>)}</select></label><label>Skills<input value={draft.skills} onChange={(event) => setDraft({ ...draft, skills: event.target.value })} placeholder="React, CSS, TypeScript" /></label></div>
        <div className={styles.formPair}><label>Salary min<input type="number" min="0" value={draft.salaryMin} onChange={(event) => setDraft({ ...draft, salaryMin: event.target.value })} /></label><label>Salary max<input type="number" min="0" value={draft.salaryMax} onChange={(event) => setDraft({ ...draft, salaryMax: event.target.value })} /></label></div>
        <button className={styles.primaryButton} disabled={busy || !companyReady}>{busy ? "Submitting…" : "Submit for review"} <ArrowRight size={14} /></button>
      </form></section>
    </div>
    <div className={styles.dashboardGrid}>
      <section className={styles.panel}><h2>Post a freelance project</h2><form className={styles.profileForm} onSubmit={createProject}>
        <label>Project title<input required maxLength={160} value={projectDraft.title} onChange={(event) => setProjectDraft({ ...projectDraft, title: event.target.value })} /></label>
        <label>Project description<textarea required rows={3} value={projectDraft.description} onChange={(event) => setProjectDraft({ ...projectDraft, description: event.target.value })} /></label>
        <label>Required skills<input value={projectDraft.skills} onChange={(event) => setProjectDraft({ ...projectDraft, skills: event.target.value })} placeholder="React, APIs, testing" /></label>
        <div className={styles.formPair}><label>Budget type<select value={projectDraft.rateType} onChange={(event) => setProjectDraft({ ...projectDraft, rateType: event.target.value })}><option>Fixed</option><option>Hourly</option></select></label><label>Duration<input value={projectDraft.duration} onChange={(event) => setProjectDraft({ ...projectDraft, duration: event.target.value })} /></label></div>
        <div className={styles.formPair}><label>Budget min<input type="number" min="0" value={projectDraft.budgetMin} onChange={(event) => setProjectDraft({ ...projectDraft, budgetMin: event.target.value })} /></label><label>Budget max<input type="number" min="0" value={projectDraft.budgetMax} onChange={(event) => setProjectDraft({ ...projectDraft, budgetMax: event.target.value })} /></label></div>
        <button className={styles.primaryButton} disabled={busy || !companyReady}>Submit project for review <ArrowRight size={14} /></button>
      </form></section>
      <section className={styles.panel}><h2>Your freelance projects</h2>{projects.length ? projects.map((project) => <article key={project._id} className={styles.employerJob}><div><strong>{project.title}</strong><span className={styles.statusBadge}>{project.status}</span><small>{proposals[project._id]?.length || 0} proposals · {project.duration}</small></div><details><summary>Review proposals</summary>{proposals[project._id]?.length ? proposals[project._id].map((proposal) => <div className={styles.applicantRow} key={proposal._id}><span><strong>{proposal.freelancer?.name || "Freelancer"}</strong><small>{proposal.freelancer?.email} · {proposal.bidAmount}</small></span><span>{proposal.status}</span><select aria-label="Update proposal status" value={proposal.status} onChange={(event) => void updateProposal(proposal._id, event.target.value)}>{["Under Review", "Shortlisted", "Accepted", "Rejected"].map((value) => <option key={value}>{value}</option>)}</select></div>) : <p className={styles.muted}>No proposals yet.</p>}</details></article>) : <p className={styles.muted}>Freelance projects appear here after posting.</p>}</section>
    </div>
    <section className={`${styles.panel} ${styles.dashboardJobs}`}><h2>Your job listings</h2>{jobs.length ? jobs.map((job) => <article key={idFor(job)} className={styles.employerJob}><div><strong>{job.title}</strong><span className={styles.statusBadge}>{job.status || "pending"}</span><small>{applications[idFor(job)]?.length || 0} applicants</small></div>{job.status === "active" && <button onClick={() => void closeJob(idFor(job))}>Close job</button>}<details><summary>Review applicants</summary>{applications[idFor(job)]?.length ? applications[idFor(job)].map((application) => <div className={styles.applicantRow} key={application._id}><span><strong>{application.applicant?.name || "Candidate"}</strong><small>{application.candidateProfile?.headline || application.applicant?.email}</small><small>{application.candidateProfile?.skills?.join(", ")}</small></span><span>{application.status}</span>{application.resumeUrl && <a href={application.resumeUrl} target="_blank" rel="noreferrer">Resume <ExternalLink size={12} /></a>}{application.candidateProfile?.linkedInUrl && <a href={application.candidateProfile.linkedInUrl} target="_blank" rel="noreferrer">LinkedIn <ExternalLink size={12} /></a>}{application.candidateProfile?.portfolioUrl && <a href={application.candidateProfile.portfolioUrl} target="_blank" rel="noreferrer">Portfolio <ExternalLink size={12} /></a>}<button onClick={() => void scheduleInterview(application._id)}>Schedule interview</button><select aria-label="Update applicant status" value={application.status} onChange={(event) => void changeStatus(application._id, event.target.value)}>{["Under Review", "Shortlisted", "Interview", "Offered", "Rejected"].map((value) => <option key={value}>{value}</option>)}</select></div>) : <p className={styles.muted}>No applications yet.</p>}</details></article>) : <p className={styles.muted}>Create your first listing to start meeting candidates.</p>}</section>
    {toast && <div className={styles.toast} role="status">{toast}</div>}
  </main></Shell>;
}

export function JobsAdminDashboard() {
  const [pending, setPending] = useState<Job[]>([]);
  const [pendingProjects, setPendingProjects] = useState<FreelanceProject[]>([]);
  const [companies, setCompanies] = useState<{ _id: string; name: string; verified: boolean; industry?: string }[]>([]);
  const [stats, setStats] = useState({ jobs: 0, pendingJobs: 0, companies: 0, applications: 0 });
  const [error, setError] = useState("");
  const { toast, notify } = useToast();
  const reload = useCallback(async () => {
    try {
      const [jobsResult, projectResult, companyResult, overview] = await Promise.all([
        apiRequest<{ jobs: Job[] }>("/jobs/admin/pending"),
        apiRequest<{ projects: FreelanceProject[] }>("/jobs/freelance/admin/pending"),
        apiRequest<{ companies: { _id: string; name: string; verified: boolean; industry?: string }[] }>("/jobs/admin/companies"),
        apiRequest<{ stats: typeof stats }>("/jobs/admin/overview"),
      ]);
      setPending(jobsResult.jobs); setPendingProjects(projectResult.projects); setCompanies(companyResult.companies); setStats(overview.stats); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Only administrators can moderate jobs."); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  async function moderate(id: string, status: string) {
    try { await apiRequest(`/jobs/admin/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await reload(); notify(`Listing ${status}.`); }
    catch (reason) { notify(reason instanceof Error ? reason.message : "The listing could not be updated."); }
  }
  async function moderateProject(id: string, status: string) {
    try { await apiRequest(`/jobs/admin/freelance/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await reload(); notify(`Project ${status}.`); }
    catch (reason) { notify(reason instanceof Error ? reason.message : "Project could not be updated."); }
  }
  async function verifyCompany(id: string, verified: boolean) {
    try { await apiRequest(`/jobs/admin/companies/${id}/verify`, { method: "PATCH", body: JSON.stringify({ verified }) }); await reload(); notify(verified ? "Company verified." : "Company verification removed."); }
    catch (reason) { notify(reason instanceof Error ? reason.message : "Company could not be updated."); }
  }
  return <Shell><main className={styles.dashboardPage}><div className={styles.dashboardHeading}><div><span className={styles.eyebrow}>PLATFORM ADMINISTRATION</span><h1>Jobs admin dashboard</h1></div><Link href="/jobs">View jobs</Link></div>
    {error && <p className={styles.inlineNotice}>{error}</p>}
    <div className={styles.statsGrid}>{Object.entries(stats).map(([key, value]) => <article key={key}><span>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).toLowerCase()}</span><strong>{value}</strong></article>)}</div>
    <section className={styles.panel}><h2>Listings awaiting review <span className={styles.countBadge}>{pending.length}</span></h2>{pending.length ? pending.map((job) => <article key={idFor(job)} className={styles.employerJob}><div><strong>{job.title}</strong><small>{companyName(job)} · {job.category}</small><small>{job.location || `${job.city}, ${job.country}`}</small></div><div className={styles.adminActions}><button onClick={() => void moderate(idFor(job), "active")}>Approve</button><button onClick={() => void moderate(idFor(job), "rejected")}>Reject</button></div></article>) : <p className={styles.muted}>No jobs are waiting for review.</p>}</section>
    <section className={`${styles.panel} ${styles.dashboardJobs}`}><h2>Freelance projects awaiting review <span className={styles.countBadge}>{pendingProjects.length}</span></h2>{pendingProjects.length ? pendingProjects.map((project) => <article key={project._id} className={styles.employerJob}><div><strong>{project.title}</strong><small>{project.duration}</small></div><div className={styles.adminActions}><button onClick={() => void moderateProject(project._id, "active")}>Approve</button><button onClick={() => void moderateProject(project._id, "rejected")}>Reject</button></div></article>) : <p className={styles.muted}>No projects are waiting for review.</p>}</section>
    <section className={`${styles.panel} ${styles.dashboardJobs}`}><h2>Company verification</h2>{companies.length ? companies.map((company) => <article key={company._id} className={styles.employerJob}><div><strong>{company.name}</strong><small>{company.industry || "Industry not provided"}</small></div><span className={styles.statusBadge}>{company.verified ? "Verified" : "Not verified"}</span><button onClick={() => void verifyCompany(company._id, !company.verified)}>{company.verified ? "Remove verification" : "Verify company"}</button></article>) : <p className={styles.muted}>No company profiles yet.</p>}</section>
    {toast && <div className={styles.toast} role="status">{toast}</div>}
  </main></Shell>;
}
