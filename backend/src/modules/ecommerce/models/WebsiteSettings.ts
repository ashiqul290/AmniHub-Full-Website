import { Schema, model } from "mongoose";

const websiteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    siteName: { type: String, default: "Omni Market", maxlength: 120 },
    contactEmail: { type: String, default: "", maxlength: 254 },
    contactPhone: { type: String, default: "", maxlength: 32 },
    socialLinks: { type: Map, of: String, default: {} },
    shippingFee: { type: Number, default: 8, min: 0 },
    freeShippingThreshold: { type: Number, default: 1500, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 1 },
  },
  { timestamps: true },
);

export default model("WebsiteSettings", websiteSettingsSchema);
