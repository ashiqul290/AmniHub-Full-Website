import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "", maxlength: 500 },
    image: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ active: 1, name: 1 });

export default model("Category", categorySchema);
