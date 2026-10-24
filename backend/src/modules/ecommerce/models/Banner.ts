import { Schema, model } from "mongoose";

const bannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    image: { type: String, required: true },
    href: { type: String, default: "" },
    placement: { type: String, enum: ["home", "category"], default: "home" },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

bannerSchema.index({ active: 1, placement: 1, sortOrder: 1 });

export default model("Banner", bannerSchema);
