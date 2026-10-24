import { Schema, model } from "mongoose";

const newsletterSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
    },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default model("NewsletterSubscriber", newsletterSubscriberSchema);
