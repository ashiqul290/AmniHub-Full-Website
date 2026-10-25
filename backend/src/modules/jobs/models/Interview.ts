import { Schema, model } from "mongoose";

const interviewSchema = new Schema(
  {
    application: { type: Schema.Types.ObjectId, ref: "JobsApplication", required: true },
    scheduledBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startsAt: { type: Date, required: true },
    meetingUrl: { type: String, default: "", maxlength: 2048 },
    notes: { type: String, default: "", maxlength: 2000 },
    status: { type: String, enum: ["scheduled", "cancelled", "completed"], default: "scheduled" },
  },
  { timestamps: true },
);

export default model("JobsInterview", interviewSchema);
