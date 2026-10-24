import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    method: { type: String, enum: ["cod", "gateway"], required: true },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    amount: { type: Number, required: true, min: 0 },
    providerReference: { type: String, default: "" },
  },
  { timestamps: true },
);

paymentSchema.index({ user: 1, createdAt: -1 });

export default model("Payment", paymentSchema);
