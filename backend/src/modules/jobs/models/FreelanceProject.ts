import { Schema, model } from "mongoose";

const freelanceProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 20000 },
    company: { type: Schema.Types.ObjectId, ref: "JobsCompany", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    skills: { type: [String], default: [] },
    budgetMin: { type: Number, min: 0, default: null },
    budgetMax: { type: Number, min: 0, default: null },
    rateType: { type: String, enum: ["Fixed", "Hourly"], required: true },
    duration: { type: String, required: true, trim: true, maxlength: 100 },
    status: { type: String, enum: ["pending", "active", "closed", "rejected"], default: "pending", index: true },
  },
  { timestamps: true },
);

freelanceProjectSchema.index({ status: 1, createdAt: -1 });
freelanceProjectSchema.index({ title: "text", description: "text", skills: "text" });

export default model("JobsFreelanceProject", freelanceProjectSchema);
