import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: { type: String, default: "", trim: true, maxlength: 32 },
    passwordHash: { type: String, required: true, select: false },
    sessionVersion: { type: Number, default: 0, min: 0 },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
      required: true,
    },
    sellerStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof userSchema>;
export default model("User", userSchema);
