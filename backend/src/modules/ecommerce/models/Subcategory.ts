import { Schema, model } from "mongoose";

const subcategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });

export default model("Subcategory", subcategorySchema);
