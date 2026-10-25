import { Router } from "express";
import mongoose, { type SortOrder } from "mongoose";
import { requireAuth, requireRole } from "../ecommerce/middleware/auth.js";
import Company from "./models/Company.js";
import Interview from "./models/Interview.js";
import Job, { experienceLevels, jobTypes, workModes } from "./models/Job.js";
import Application from "./models/JobApplication.js";
import FreelanceProject from "./models/FreelanceProject.js";
import Proposal from "./models/Proposal.js";
import Profile from "./models/JobSeekerProfile.js";
import SavedJob from "./models/SavedJob.js";

const router = Router();

export const jobCategories = [
  "Web Development", "Software Engineering", "Frontend Development", "Backend Development",
  "Full Stack Development", "UI/UX Design", "Graphic Design", "Digital Marketing", "SEO",
  "Data Science", "AI & Machine Learning", "Customer Support", "Sales & Marketing",
  "Finance & Accounting", "Human Resources", "Other Jobs",
];

const isText = (value: unknown, max = 20000): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
const isOptionalText = (value: unknown, max = 20000) =>
  value === undefined || (typeof value === "string" && value.length <= max);
const isEnum = (value: unknown, values: readonly string[]) =>
  typeof value === "string" && values.includes(value);
const isUrl = (value: unknown) => {
  if (value === undefined || value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
};
const isStringList = (value: unknown, maxItems = 30) =>
  value === undefined ||
  (Array.isArray(value) && value.length <= maxItems &&
    value.every((item) => typeof item === "string" && item.trim().length <= 120));
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pageParams = (request: { query: Record<string, unknown> }) => {
  const page = Math.max(1, Number.parseInt(String(request.query.page || "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(request.query.limit || "12"), 10) || 12));
  return { page, limit, skip: (page - 1) * limit };
};

function validJob(body: Record<string, unknown>, partial = false) {
  const requiredText = ["title", "category", "description", "country"] as const;
  if (!partial && requiredText.some((field) => !isText(body[field], field === "description" ? 20000 : 160))) return false;
  if (requiredText.some((field) => Object.hasOwn(body, field) && !isText(body[field], field === "description" ? 20000 : 160))) return false;
  if (Object.hasOwn(body, "category") && !jobCategories.includes(String(body.category))) return false;
  if (Object.hasOwn(body, "workMode") && !isEnum(body.workMode, workModes)) return false;
  if (Object.hasOwn(body, "type") && !isEnum(body.type, jobTypes)) return false;
  if (Object.hasOwn(body, "experience") && !isEnum(body.experience, experienceLevels)) return false;
  if (!partial && (!isEnum(body.workMode, workModes) || !isEnum(body.type, jobTypes) || !isEnum(body.experience, experienceLevels))) return false;
  if (!isStringList(body.skills) || !isStringList(body.responsibilities) ||
      !isStringList(body.qualifications) || !isStringList(body.benefits)) return false;
  for (const field of ["city", "currency"] as const) if (!isOptionalText(body[field], 100)) return false;
  for (const field of ["salaryMin", "salaryMax"] as const) {
    if (body[field] !== undefined && body[field] !== null && (!Number.isFinite(body[field]) || Number(body[field]) < 0)) return false;
  }
  if (body.salaryMin != null && body.salaryMax != null && Number(body.salaryMin) > Number(body.salaryMax)) return false;
  if (body.deadline !== undefined && body.deadline !== null &&
      (!Number.isFinite(Date.parse(String(body.deadline))) || Date.parse(String(body.deadline)) <= Date.now())) return false;
  return true;
}

const jobFields = [
  "title", "category", "description", "responsibilities", "qualifications", "benefits",
  "skills", "country", "city", "workMode", "type", "experience", "salaryMin",
  "salaryMax", "currency", "deadline",
] as const;
const pickJobFields = (body: Record<string, unknown>) =>
  Object.fromEntries(jobFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));

router.get("/categories", (_request, response) => {
  response.json({ categories: jobCategories });
});

router.get("/", async (request, response, next) => {
  try {
    const { page, limit, skip } = pageParams(request);
    const filter: Record<string, unknown> = { status: "active" };
    for (const field of ["workMode", "type", "experience", "category"] as const) {
      if (typeof request.query[field] === "string" && request.query[field] !== "All") {
        const allowed = field === "workMode" ? workModes : field === "type" ? jobTypes : field === "experience" ? experienceLevels : jobCategories;
        if (allowed.includes(request.query[field] as never)) filter[field] = request.query[field];
      }
    }
    for (const field of ["country", "city"] as const) {
      if (typeof request.query[field] === "string" && request.query[field].trim()) {
        filter[field] = new RegExp(escapeRegex(request.query[field].trim().slice(0, 100)), "i");
      }
    }
    const minSalary = Number(request.query.minSalary);
    const maxSalary = Number(request.query.maxSalary);
    if (Number.isFinite(minSalary)) filter.salaryMax = { $gte: minSalary };
    if (Number.isFinite(maxSalary)) filter.salaryMin = { ...(filter.salaryMin as object ?? {}), $lte: maxSalary };
    if (typeof request.query.company === "string" && request.query.company.trim()) {
      const companyIds = (await Company.find({ name: new RegExp(escapeRegex(request.query.company.trim().slice(0, 100)), "i") }).select("_id").lean()).map((company) => company._id);
      filter.company = { $in: companyIds };
    }
    if (typeof request.query.q === "string" && request.query.q.trim()) {
      const term = escapeRegex(request.query.q.trim().slice(0, 100));
      const companyIds = (await Company.find({ name: new RegExp(term, "i") }).select("_id").lean()).map((company) => company._id);
      filter.$or = [
        { title: new RegExp(term, "i") },
        { description: new RegExp(term, "i") },
        { category: new RegExp(term, "i") },
        { skills: new RegExp(term, "i") },
        { company: { $in: companyIds } },
      ];
    }
    const postedWithin = Number(request.query.postedWithin);
    if (Number.isFinite(postedWithin) && postedWithin > 0) {
      filter.createdAt = { $gte: new Date(Date.now() - Math.min(postedWithin, 365) * 86400000) };
    }
    const sort: Record<string, SortOrder> = request.query.sort === "salary"
      ? { salaryMax: -1, createdAt: -1 }
      : request.query.sort === "oldest"
        ? { createdAt: 1 }
        : { featured: -1, createdAt: -1 };
    const [jobs, total] = await Promise.all([
      Job.find(filter).populate("company", "name logoUrl website industry city country verified").sort(sort).skip(skip).limit(limit).lean(),
      Job.countDocuments(filter),
    ]);
    response.json({ jobs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.get("/freelance/mine", requireAuth, requireRole("seller", "admin"), async (_request, response, next) => {
  try {
    const filter = response.locals.user?.role === "admin" ? {} : { createdBy: response.locals.user?.id };
    const projects = await FreelanceProject.find(filter).populate("company", "name logoUrl").sort({ createdAt: -1 }).lean();
    response.json({ projects });
  } catch (error) {
    next(error);
  }
});

router.get("/freelance/admin/pending", requireAuth, requireRole("admin"), async (_request, response, next) => {
  try {
    const projects = await FreelanceProject.find({ status: "pending" })
      .populate("company", "name logoUrl").sort({ createdAt: 1 }).lean();
    response.json({ projects });
  } catch (error) {
    next(error);
  }
});

router.get("/mine", requireAuth, requireRole("seller", "admin"), async (_request, response, next) => {
  try {
    const filter = response.locals.user?.role === "admin" ? {} : { createdBy: response.locals.user?.id };
    const jobs = await Job.find(filter).populate("company", "name logoUrl").sort({ createdAt: -1 }).lean();
    response.json({ jobs });
  } catch (error) {
    next(error);
  }
});

router.get("/applications/mine", requireAuth, requireRole("customer"), async (_request, response, next) => {
  try {
    const applications = await Application.find({ applicant: response.locals.user?.id })
      .populate({ path: "job", populate: { path: "company", select: "name logoUrl city country" } })
      .sort({ createdAt: -1 }).lean();
    response.json({ applications });
  } catch (error) {
    next(error);
  }
});

router.get("/saved", requireAuth, requireRole("customer"), async (_request, response, next) => {
  try {
    const savedJobs = await SavedJob.find({ user: response.locals.user?.id })
      .populate({ path: "job", match: { status: "active" }, populate: { path: "company", select: "name logoUrl city country" } })
      .sort({ createdAt: -1 }).lean();
    response.json({ savedJobs: savedJobs.filter((saved) => saved.job) });
  } catch (error) {
    next(error);
  }
});

router.get("/profile", requireAuth, requireRole("customer"), async (_request, response, next) => {
  try {
    const profile = await Profile.findOne({ user: response.locals.user?.id }).lean();
    response.json({ profile });
  } catch (error) {
    next(error);
  }
});

router.put("/profile", requireAuth, requireRole("customer"), async (request, response, next) => {
  try {
    const body = request.body ?? {};
    const textFields = ["headline", "summary"] as const;
    if (textFields.some((field) => !isOptionalText(body[field], field === "summary" ? 5000 : 160)) ||
        !isStringList(body.skills, 50) || !isStringList(body.certifications, 30) ||
        !isUrl(body.portfolioUrl) || !isUrl(body.linkedInUrl) || !isUrl(body.resumeUrl)) {
      response.status(400).json({ message: "Profile details are invalid." });
      return;
    }
    for (const field of ["experience", "education"] as const) {
      if (body[field] !== undefined && (!Array.isArray(body[field]) || body[field].length > 20 ||
          body[field].some((entry: unknown) => typeof entry !== "object" || entry === null))) {
        response.status(400).json({ message: "Profile details are invalid." });
        return;
      }
    }
    const allowed = ["headline", "summary", "skills", "experience", "education", "certifications", "portfolioUrl", "linkedInUrl", "resumeUrl"];
    const update = Object.fromEntries(allowed.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));
    const profile = await Profile.findOneAndUpdate(
      { user: response.locals.user?.id },
      { $set: update, $setOnInsert: { user: response.locals.user?.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    response.json({ profile });
  } catch (error) {
    next(error);
  }
});

router.post("/company", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    const body = request.body ?? {};
    if (!isText(body.name, 120) || !isOptionalText(body.description, 5000) ||
        !isOptionalText(body.industry, 100) || !isOptionalText(body.city, 100) ||
        !isOptionalText(body.country, 100) || !isUrl(body.logoUrl) || !isUrl(body.website)) {
      response.status(400).json({ message: "Company details are invalid." });
      return;
    }
    const companyFields = ["name", "description", "logoUrl", "website", "industry", "country", "city"] as const;
    const companyUpdate = Object.fromEntries(
      companyFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]),
    );
    const company = await Company.findOneAndUpdate(
      { owner: response.locals.user?.id },
      { $set: { ...companyUpdate, verified: false }, $setOnInsert: { owner: response.locals.user?.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    response.status(200).json({ company });
  } catch (error) {
    next(error);
  }
});

router.get("/company/mine", requireAuth, requireRole("seller", "admin"), async (_request, response, next) => {
  try {
    const company = await Company.findOne({ owner: response.locals.user?.id }).lean();
    response.json({ company });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!validJob(request.body ?? {})) {
      response.status(400).json({ message: "Complete all required job details using valid job type, work mode, and experience values." });
      return;
    }
    const company = await Company.findOne({ owner: response.locals.user?.id });
    if (!company) {
      response.status(400).json({ message: "Create your company profile before posting a job." });
      return;
    }
    const job = await Job.create({
      ...pickJobFields(request.body),
      company: company._id,
      createdBy: response.locals.user?.id,
      status: "pending",
    });
    response.status(201).json({ job });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) || !validJob(request.body ?? {}, true) ||
        Object.keys(pickJobFields(request.body ?? {})).length === 0) {
      response.status(400).json({ message: "Job details are invalid." });
      return;
    }
    const filter = response.locals.user?.role === "admin"
      ? { _id: request.params.id }
      : { _id: request.params.id, createdBy: response.locals.user?.id };
    const job = await Job.findOneAndUpdate(
      filter,
      { $set: { ...pickJobFields(request.body), status: "pending" } },
      { new: true, runValidators: true },
    );
    if (!job) {
      response.status(404).json({ message: "Job not found in your listings." });
      return;
    }
    response.json({ job });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/close", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: "Job not found." });
      return;
    }
    const filter = response.locals.user?.role === "admin"
      ? { _id: request.params.id }
      : { _id: request.params.id, createdBy: response.locals.user?.id };
    const job = await Job.findOneAndUpdate(filter, { status: "closed" }, { new: true });
    if (!job) {
      response.status(404).json({ message: "Job not found in your listings." });
      return;
    }
    response.json({ job });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: "Job not found." });
      return;
    }
    const filter = response.locals.user?.role === "admin"
      ? { _id: request.params.id }
      : { _id: request.params.id, createdBy: response.locals.user?.id };
    const job = await Job.findOneAndDelete(filter);
    if (!job) {
      response.status(404).json({ message: "Job not found in your listings." });
      return;
    }
    const applicationIds = (await Application.find({ job: job._id }).select("_id").lean()).map((application) => application._id);
    await Promise.all([
      Application.deleteMany({ job: job._id }),
      SavedJob.deleteMany({ job: job._id }),
      Interview.deleteMany({ application: { $in: applicationIds } }),
    ]);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.delete("/applications/:applicationId", requireAuth, requireRole("customer"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.applicationId)) {
      response.status(404).json({ message: "Application not found." });
      return;
    }
    const application = await Application.findOne({
      _id: request.params.applicationId,
      applicant: response.locals.user?.id,
      status: { $in: ["Applied", "Under Review"] },
    });
    if (!application) {
      response.status(404).json({ message: "Application not found or can no longer be withdrawn." });
      return;
    }
    application.status = "Withdrawn";
    await application.save();
    response.json({ application });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/:id", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) ||
        !["active", "rejected", "closed"].includes(request.body?.status) ||
        (request.body?.featured !== undefined && typeof request.body.featured !== "boolean")) {
      response.status(400).json({ message: "Moderation details are invalid." });
      return;
    }
    if (request.body.status === "active") {
      const pendingJob = await Job.findById(request.params.id).select("company");
      if (!pendingJob || !(await Company.exists({ _id: pendingJob.company, verified: true }))) {
        response.status(400).json({ message: "Verify the employer company before approving this job." });
        return;
      }
    }
    const update: Record<string, unknown> = { status: request.body.status };
    if (request.body.featured !== undefined) update.featured = request.body.featured;
    const job = await Job.findByIdAndUpdate(request.params.id, update, { new: true, runValidators: true });
    if (!job) {
      response.status(404).json({ message: "Job not found." });
      return;
    }
    response.json({ job });
  } catch (error) {
    next(error);
  }
});

router.patch("/applications/:applicationId/status", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.applicationId) ||
        !["Under Review", "Shortlisted", "Interview", "Offered", "Rejected", "Withdrawn"].includes(request.body?.status)) {
      response.status(400).json({ message: "Application status is invalid." });
      return;
    }
    const application = await Application.findById(request.params.applicationId).populate("job");
    const job = application?.job as unknown as { _id: mongoose.Types.ObjectId; createdBy: mongoose.Types.ObjectId } | undefined;
    if (!application || !job || (response.locals.user?.role !== "admin" && String(job.createdBy) !== response.locals.user?.id)) {
      response.status(404).json({ message: "Application not found for your job listings." });
      return;
    }
    application.status = request.body.status;
    await application.save();
    response.json({ application });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/applications", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: "Job not found." });
      return;
    }
    const filter = response.locals.user?.role === "admin"
      ? { _id: request.params.id }
      : { _id: request.params.id, createdBy: response.locals.user?.id };
    const job = await Job.findOne(filter).select("_id");
    if (!job) {
      response.status(404).json({ message: "Job not found in your listings." });
      return;
    }
    const applications = await Application.find({ job: job._id })
      .populate("applicant", "name email")
      .sort({ createdAt: -1 }).lean();
    const applicantIds: mongoose.Types.ObjectId[] = [];
    for (const application of applications) {
      const applicant = application.applicant as unknown as { _id: mongoose.Types.ObjectId } | null;
      if (applicant?._id) applicantIds.push(applicant._id);
    }
    const profiles = await Profile.find({ user: { $in: applicantIds } })
      .select("user headline summary skills resumeUrl linkedInUrl portfolioUrl").lean();
    const profileByUser = new Map(profiles.map((profile) => [String(profile.user), profile]));
    response.json({
      applications: applications.map((application) => {
        const applicant = application.applicant as unknown as { _id: mongoose.Types.ObjectId } | null;
        return { ...application, candidateProfile: applicant ? profileByUser.get(String(applicant._id)) || null : null };
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/apply", requireAuth, requireRole("customer"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) ||
        !isOptionalText(request.body?.coverLetter, 5000) || !isUrl(request.body?.resumeUrl)) {
      response.status(400).json({ message: "Application details are invalid." });
      return;
    }
    const job = await Job.findOne({ _id: request.params.id, status: "active" });
    if (!job) {
      response.status(404).json({ message: "This job is no longer accepting applications." });
      return;
    }
    if (job.deadline && job.deadline < new Date()) {
      response.status(400).json({ message: "The application deadline has passed." });
      return;
    }
    const profile = await Profile.findOne({ user: response.locals.user?.id }).select("resumeUrl").lean();
    const application = await Application.create({
      job: job._id,
      applicant: response.locals.user?.id,
      coverLetter: request.body?.coverLetter || "",
      resumeUrl: request.body?.resumeUrl || profile?.resumeUrl || "",
    });
    response.status(201).json({ application });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      response.status(409).json({ message: "You have already applied to this job." });
      return;
    }
    next(error);
  }
});

router.put("/:id/save", requireAuth, requireRole("customer"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: "Job not found." });
      return;
    }
    if (!(await Job.exists({ _id: request.params.id, status: "active" }))) {
      response.status(404).json({ message: "Job not found." });
      return;
    }
    await SavedJob.updateOne(
      { user: response.locals.user?.id, job: request.params.id },
      { $setOnInsert: { user: response.locals.user?.id, job: request.params.id } },
      { upsert: true },
    );
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/save", requireAuth, requireRole("customer"), async (request, response, next) => {
  try {
    await SavedJob.deleteOne({ user: response.locals.user?.id, job: request.params.id });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: "Job not found." });
      return;
    }
    const job = await Job.findOne({ _id: request.params.id, status: "active" })
      .populate("company", "name description logoUrl website industry city country verified").lean();
    if (!job) {
      response.status(404).json({ message: "Job not found." });
      return;
    }
    response.json({ job });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/pending", requireAuth, requireRole("admin"), async (_request, response, next) => {
  try {
    const jobs = await Job.find({ status: "pending" }).populate("company", "name logoUrl").sort({ createdAt: 1 }).lean();
    response.json({ jobs });
  } catch (error) {
    next(error);
  }
});

router.post("/interviews", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    const { applicationId, startsAt, meetingUrl, notes } = request.body ?? {};
    if (!mongoose.isValidObjectId(applicationId) || !Number.isFinite(Date.parse(startsAt)) ||
        new Date(startsAt) <= new Date() || !isUrl(meetingUrl) || !isOptionalText(notes, 2000)) {
      response.status(400).json({ message: "Interview details are invalid." });
      return;
    }
    const application = await Application.findById(applicationId).populate("job");
    const job = application?.job as unknown as { createdBy: mongoose.Types.ObjectId } | undefined;
    if (!application || !job || (response.locals.user?.role !== "admin" && String(job.createdBy) !== response.locals.user?.id)) {
      response.status(404).json({ message: "Application not found for your job listings." });
      return;
    }
    application.status = "Interview";
    await application.save();
    const interview = await Interview.create({
      application: application._id,
      scheduledBy: response.locals.user?.id,
      startsAt: new Date(startsAt),
      meetingUrl: meetingUrl || "",
      notes: notes || "",
    });
    response.status(201).json({ interview });
  } catch (error) {
    next(error);
  }
});

router.get("/interviews/mine", requireAuth, requireRole("customer"), async (_request, response, next) => {
  try {
    const applications = await Application.find({ applicant: response.locals.user?.id }).select("_id");
    const interviews = await Interview.find({ application: { $in: applications.map((application) => application._id) } })
      .populate({ path: "application", populate: { path: "job", populate: { path: "company", select: "name logoUrl" } } })
      .sort({ startsAt: 1 }).lean();
    response.json({ interviews });
  } catch (error) {
    next(error);
  }
});

router.get("/freelance", async (request, response, next) => {
  try {
    const { page, limit, skip } = pageParams(request);
    const filter: Record<string, unknown> = { status: "active" };
    if (typeof request.query.q === "string" && request.query.q.trim()) {
      const term = new RegExp(escapeRegex(request.query.q.trim().slice(0, 100)), "i");
      filter.$or = [{ title: term }, { description: term }, { skills: term }];
    }
    const sort: Record<string, SortOrder> = request.query.sort === "budget" ? { budgetMax: -1 } : { createdAt: -1 };
    const [projects, total] = await Promise.all([
      FreelanceProject.find(filter).populate("company", "name logoUrl").sort(sort).skip(skip).limit(limit).lean(),
      FreelanceProject.countDocuments(filter),
    ]);
    response.json({ projects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.post("/freelance", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    const body = request.body ?? {};
    if (!isText(body.title, 160) || !isText(body.description, 20000) || !isStringList(body.skills) ||
        !isText(body.duration, 100) || !isEnum(body.rateType, ["Fixed", "Hourly"]) ||
        (body.budgetMin !== undefined && body.budgetMin !== null && (!Number.isFinite(body.budgetMin) || Number(body.budgetMin) < 0)) ||
        (body.budgetMax !== undefined && body.budgetMax !== null && (!Number.isFinite(body.budgetMax) || Number(body.budgetMax) < 0))) {
      response.status(400).json({ message: "Freelance project details are invalid." });
      return;
    }
    const company = await Company.findOne({ owner: response.locals.user?.id });
    if (!company) {
      response.status(400).json({ message: "Create your company profile before posting a project." });
      return;
    }
    const project = await FreelanceProject.create({
      title: body.title.trim(),
      description: body.description.trim(),
      skills: body.skills || [],
      duration: body.duration.trim(),
      rateType: body.rateType,
      budgetMin: body.budgetMin ?? null,
      budgetMax: body.budgetMax ?? null,
      company: company._id,
      createdBy: response.locals.user?.id,
      status: "pending",
    });
    response.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

router.get("/freelance/:id/proposals", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: "Project not found." });
      return;
    }
    const filter = response.locals.user?.role === "admin"
      ? { _id: request.params.id }
      : { _id: request.params.id, createdBy: response.locals.user?.id };
    const project = await FreelanceProject.findOne(filter).select("_id");
    if (!project) {
      response.status(404).json({ message: "Project not found in your listings." });
      return;
    }
    const proposals = await Proposal.find({ project: project._id }).populate("freelancer", "name email").sort({ createdAt: -1 }).lean();
    response.json({ proposals });
  } catch (error) {
    next(error);
  }
});

router.get("/freelance/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: "Project not found." });
      return;
    }
    const project = await FreelanceProject.findOne({ _id: request.params.id, status: "active" })
      .populate("company", "name description logoUrl website").lean();
    if (!project) {
      response.status(404).json({ message: "Project not found." });
      return;
    }
    response.json({ project });
  } catch (error) {
    next(error);
  }
});

router.post("/freelance/:id/proposals", requireAuth, requireRole("customer"), async (request, response, next) => {
  try {
    const body = request.body ?? {};
    if (!mongoose.isValidObjectId(request.params.id) || !isText(body.coverLetter, 5000) ||
        !Number.isFinite(body.bidAmount) || Number(body.bidAmount) < 0 || !isUrl(body.portfolioUrl)) {
      response.status(400).json({ message: "Proposal details are invalid." });
      return;
    }
    const project = await FreelanceProject.findOne({ _id: request.params.id, status: "active" });
    if (!project) {
      response.status(404).json({ message: "This project is no longer accepting proposals." });
      return;
    }
    const proposal = await Proposal.create({
      project: project._id,
      freelancer: response.locals.user?.id,
      coverLetter: body.coverLetter.trim(),
      bidAmount: Number(body.bidAmount),
      portfolioUrl: body.portfolioUrl || "",
    });
    response.status(201).json({ proposal });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      response.status(409).json({ message: "You have already submitted a proposal for this project." });
      return;
    }
    next(error);
  }
});

router.get("/proposals/mine", requireAuth, requireRole("customer"), async (_request, response, next) => {
  try {
    const proposals = await Proposal.find({ freelancer: response.locals.user?.id })
      .populate({ path: "project", populate: { path: "company", select: "name logoUrl" } })
      .sort({ createdAt: -1 }).lean();
    response.json({ proposals });
  } catch (error) {
    next(error);
  }
});

router.patch("/proposals/:id/status", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) ||
        !["Under Review", "Shortlisted", "Accepted", "Rejected"].includes(request.body?.status)) {
      response.status(400).json({ message: "Proposal status is invalid." });
      return;
    }
    const proposal = await Proposal.findById(request.params.id).populate("project");
    const project = proposal?.project as unknown as { createdBy: mongoose.Types.ObjectId } | undefined;
    if (!proposal || !project || (response.locals.user?.role !== "admin" && String(project.createdBy) !== response.locals.user?.id)) {
      response.status(404).json({ message: "Proposal not found for your projects." });
      return;
    }
    proposal.status = request.body.status;
    await proposal.save();
    response.json({ proposal });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/freelance/:id", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) ||
        !["active", "rejected", "closed"].includes(request.body?.status)) {
      response.status(400).json({ message: "Project moderation details are invalid." });
      return;
    }
    if (request.body.status === "active") {
      const pendingProject = await FreelanceProject.findById(request.params.id).select("company");
      if (!pendingProject || !(await Company.exists({ _id: pendingProject.company, verified: true }))) {
        response.status(400).json({ message: "Verify the employer company before approving this project." });
        return;
      }
    }
    const project = await FreelanceProject.findByIdAndUpdate(
      request.params.id,
      { status: request.body.status },
      { new: true, runValidators: true },
    );
    if (!project) {
      response.status(404).json({ message: "Project not found." });
      return;
    }
    response.json({ project });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/companies", requireAuth, requireRole("admin"), async (_request, response, next) => {
  try {
    const companies = await Company.find().populate("owner", "name email").sort({ createdAt: -1 }).lean();
    response.json({ companies });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/companies/:id/verify", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) || typeof request.body?.verified !== "boolean") {
      response.status(400).json({ message: "Company verification details are invalid." });
      return;
    }
    const company = await Company.findByIdAndUpdate(
      request.params.id,
      { verified: request.body.verified },
      { new: true, runValidators: true },
    );
    if (!company) {
      response.status(404).json({ message: "Company not found." });
      return;
    }
    response.json({ company });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/overview", requireAuth, requireRole("admin"), async (_request, response, next) => {
  try {
    const [jobs, pendingJobs, companies, applications] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: "pending" }),
      Company.countDocuments(),
      Application.countDocuments(),
    ]);
    response.json({ stats: { jobs, pendingJobs, companies, applications } });
  } catch (error) {
    next(error);
  }
});

export default router;
