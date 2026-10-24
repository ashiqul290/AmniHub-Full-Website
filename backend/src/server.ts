import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const port = Number(process.env.PORT) || 4000;

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI must be configured before starting the API.");
}

await mongoose.connect(mongoUri);
app.listen(port, () => {
  console.log(`OmniHub backend listening on port ${port}`);
});
