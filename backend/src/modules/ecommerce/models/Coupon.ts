import { Schema, model } from "mongoose";

const couponSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minimumOrder: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default model("Coupon", couponSchema);
