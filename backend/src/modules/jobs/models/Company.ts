import { Schema, model } from "mongoose";

const companySchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 5000 },
    logoUrl: { type: String, default: "", maxlength: 2048 },
    website: { type: String, default: "", maxlength: 2048 },
    industry: { type: String, default: "", trim: true, maxlength: 100 },
    country: { type: String, default: "", trim: true, maxlength: 100 },
    city: { type: String, default: "", trim: true, maxlength: 100 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

companySchema.index({ name: "text", industry: "text" });

export default model("JobsCompany", companySchema);
