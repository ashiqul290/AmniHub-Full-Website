import { Schema, model } from "mongoose";

const proposalSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "JobsFreelanceProject", required: true },
    freelancer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    coverLetter: { type: String, required: true, trim: true, maxlength: 5000 },
    bidAmount: { type: Number, min: 0, required: true },
    portfolioUrl: { type: String, default: "", maxlength: 2048 },
    status: { type: String, enum: ["Submitted", "Under Review", "Shortlisted", "Accepted", "Rejected", "Withdrawn"], default: "Submitted" },
  },
  { timestamps: true },
);

proposalSchema.index({ project: 1, freelancer: 1 }, { unique: true });
proposalSchema.index({ freelancer: 1, createdAt: -1 });

export default model("JobsProposal", proposalSchema);
