import { Schema, model } from "mongoose";

const savedJobSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    job: { type: Schema.Types.ObjectId, ref: "JobsJob", required: true },
  },
  { timestamps: true },
);

savedJobSchema.index({ user: 1, job: 1 }, { unique: true });
savedJobSchema.index({ user: 1, createdAt: -1 });

export default model("JobsSavedJob", savedJobSchema);
