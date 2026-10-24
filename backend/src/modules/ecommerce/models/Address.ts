import { Schema, model } from "mongoose";

const addressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 32 },
    line1: { type: String, required: true, trim: true, maxlength: 160 },
    line2: { type: String, default: "", trim: true, maxlength: 160 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 30 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

addressSchema.index({ user: 1, isDefault: -1 });

export default model("Address", addressSchema);
