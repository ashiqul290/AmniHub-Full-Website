import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createUploadSignature } from "../services/cloudinary.js";

const router = Router();

router.post("/signature", requireAuth, requireRole("seller", "admin"), (request, response, next) => {
  const scope = request.body?.scope;
  if (scope !== "product" && scope !== "store") {
    response.status(400).json({ message: "Choose a valid upload purpose." });
    return;
  }
  try {
    response.json(createUploadSignature(scope));
  } catch (error) {
    next(error);
  }
});

export default router;
