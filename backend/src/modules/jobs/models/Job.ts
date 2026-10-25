import { Schema, model } from "mongoose";

export const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"] as const;
export const workModes = ["Remote", "Hybrid", "On-site"] as const;
export const experienceLevels = ["Entry-level", "Mid-level", "Senior-level"] as const;
export const applicationStatuses = ["Applied", "Under Review", "Shortlisted", "Interview", "Offered", "Rejected", "Withdrawn"] as const;

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
    company: { type: Schema.Types.ObjectId, ref: "JobsCompany", required: true, index: true },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 20000 },
    responsibilities: { type: [String], default: [] },
    qualifications: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    city: { type: String, default: "", trim: true, maxlength: 100 },
    workMode: { type: String, enum: workModes, required: true },
    type: { type: String, enum: jobTypes, required: true },
    experience: { type: String, enum: experienceLevels, required: true },
    salaryMin: { type: Number, min: 0, default: null },
    salaryMax: { type: Number, min: 0, default: null },
    currency: { type: String, default: "USD", uppercase: true, minlength: 3, maxlength: 3 },
    deadline: { type: Date, default: null },
    status: { type: String, enum: ["pending", "active", "closed", "rejected"], default: "pending", index: true },
    featured: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

jobSchema.index({ title: "text", description: "text", skills: "text", category: "text" });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ workMode: 1, type: 1, experience: 1 });

export default model("JobsJob", jobSchema);
