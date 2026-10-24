import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, maxlength: 40 },
    message: { type: String, required: true, maxlength: 500 },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default model("Notification", notificationSchema);
