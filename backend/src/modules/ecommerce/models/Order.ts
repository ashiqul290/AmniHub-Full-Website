import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        image: { type: String, default: "" },
        unitPrice: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        status: {
          type: String,
          enum: ["processing", "shipped", "delivered", "cancelled"],
          default: "processing",
        },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: "" },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cod"], required: true },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "items.seller": 1, createdAt: -1 });

export default model("Order", orderSchema);
