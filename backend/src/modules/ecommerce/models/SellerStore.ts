import { Schema, model } from "mongoose";

const sellerStoreSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, default: "", maxlength: 2000 },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 32 },
    status: { type: String, enum: ["pending", "approved", "suspended"], default: "pending" },
  },
  { timestamps: true },
);

export default model("SellerStore", sellerStoreSchema);
