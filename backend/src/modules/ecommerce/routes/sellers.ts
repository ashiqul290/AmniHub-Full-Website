import { Router } from "express";
import SellerStore from "../models/SellerStore.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("seller"));

router.get("/store", async (_request, response, next) => {
  try {
    const store = await SellerStore.findOne({ owner: response.locals.user?.id }).lean();
    response.json({ store });
  } catch (error) {
    next(error);
  }
});

router.put("/store", async (request, response, next) => {
  try {
    const { name, description = "", logo = "", banner = "", email = "", phone = "" } =
      request.body ?? {};
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.length > 120 ||
      typeof description !== "string" ||
      description.length > 2000 ||
      typeof logo !== "string" ||
      typeof banner !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string"
    ) {
      response.status(400).json({ message: "Store profile details are invalid." });
      return;
    }
    const owner = response.locals.user?.id;
    const store = await SellerStore.findOneAndUpdate(
      { owner },
      {
        $set: {
          name: name.trim(),
          description: description.trim(),
          logo,
          banner,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        },
        $setOnInsert: {
          owner,
          slug: `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${String(owner).slice(-6)}`,
          status: "approved",
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    response.json({ store });
  } catch (error) {
    next(error);
  }
});

export default router;
