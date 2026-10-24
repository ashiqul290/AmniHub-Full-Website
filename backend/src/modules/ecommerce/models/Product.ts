import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    brand: { type: String, default: "", trim: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "hidden"],
      default: "active",
      required: true,
    },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ category: 1, status: 1, price: 1 });
productSchema.index({ seller: 1, createdAt: -1 });

export default model("Product", productSchema);
