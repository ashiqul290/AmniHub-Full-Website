import { Schema, model } from "mongoose";

const brandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    logo: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default model("Brand", brandSchema);
