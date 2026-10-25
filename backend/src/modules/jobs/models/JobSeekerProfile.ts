import { Schema, model } from "mongoose";

const jobSeekerProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    headline: { type: String, default: "", maxlength: 160 },
    summary: { type: String, default: "", maxlength: 5000 },
    skills: { type: [String], default: [] },
    experience: { type: [Schema.Types.Mixed], default: [] },
    education: { type: [Schema.Types.Mixed], default: [] },
    certifications: { type: [String], default: [] },
    portfolioUrl: { type: String, default: "", maxlength: 2048 },
    linkedInUrl: { type: String, default: "", maxlength: 2048 },
    resumeUrl: { type: String, default: "", maxlength: 2048 },
  },
  { timestamps: true },
);

export default model("JobsSeekerProfile", jobSeekerProfileSchema);
