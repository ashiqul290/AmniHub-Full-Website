import { Schema, model } from "mongoose";
import { applicationStatuses } from "./Job.js";

const applicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: "JobsJob", required: true },
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resumeUrl: { type: String, default: "", maxlength: 2048 },
    coverLetter: { type: String, default: "", maxlength: 5000 },
    status: { type: String, enum: applicationStatuses, default: "Applied" },
    employerNote: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true },
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, createdAt: -1 });

export default model("JobsApplication", applicationSchema);
