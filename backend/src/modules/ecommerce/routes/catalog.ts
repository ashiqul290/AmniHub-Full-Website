import { Router } from "express";
import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import Banner from "../models/Banner.js";
import WebsiteSettings from "../models/WebsiteSettings.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const validText = (value: unknown, max: number) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

router.get("/categories", async (_request, response, next) => {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 }).lean();
    response.json({ categories });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/categories/admin",
  requireAuth,
  requireRole("admin"),
  async (_request, response, next) => {
    try {
      const categories = await Category.find().sort({ name: 1 }).lean();
      response.json({ categories });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/categories", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    const { name, description = "", image = "" } = request.body ?? {};
    if (!validText(name, 80) || typeof description !== "string" || typeof image !== "string") {
      response.status(400).json({ message: "Category details are invalid." });
      return;
    }
    const category = await Category.create({ name: name.trim(), slug: slugify(name), description, image });
    response.status(201).json({ category });
  } catch (error) {
    next(error);
  }
});

router.patch("/categories/:id", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    const { id } = request.params;
    const { name, description, image, active } = request.body ?? {};
    if (
      !mongoose.isValidObjectId(id) ||
      (name !== undefined && !validText(name, 80)) ||
      (description !== undefined && typeof description !== "string") ||
      (image !== undefined && typeof image !== "string") ||
      (active !== undefined && typeof active !== "boolean")
    ) {
      response.status(400).json({ message: "Category details are invalid." });
      return;
    }
    const update: Record<string, unknown> = { ...(name !== undefined ? { name: name.trim(), slug: slugify(name) } : {}) };
    if (description !== undefined) update.description = description;
    if (image !== undefined) update.image = image;
    if (active !== undefined) update.active = active;
    const category = await Category.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!category) {
      response.status(404).json({ message: "Category not found." });
      return;
    }
    response.json({ category });
  } catch (error) {
    next(error);
  }
});

router.delete("/categories/:id", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(400).json({ message: "Category id is invalid." });
      return;
    }
    const result = await Category.findByIdAndDelete(request.params.id);
    if (!result) {
      response.status(404).json({ message: "Category not found." });
      return;
    }
    await Subcategory.deleteMany({ category: result._id });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/brands", async (_request, response, next) => {
  try {
    const brands = await Brand.find({ active: true }).sort({ name: 1 }).lean();
    response.json({ brands });
  } catch (error) {
    next(error);
  }
});

router.get("/brands/admin", requireAuth, requireRole("admin"), async (_request, response, next) => {
  try {
    const brands = await Brand.find().sort({ name: 1 }).lean();
    response.json({ brands });
  } catch (error) {
    next(error);
  }
});

router.post("/brands", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    const { name, logo = "" } = request.body ?? {};
    if (!validText(name, 80) || typeof logo !== "string" || logo.length > 2048) {
      response.status(400).json({ message: "Brand details are invalid." });
      return;
    }
    const brand = await Brand.create({ name: name.trim(), slug: slugify(name), logo });
    response.status(201).json({ brand });
  } catch (error) {
    next(error);
  }
});

router.delete("/brands/:id", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(400).json({ message: "Brand id is invalid." });
      return;
    }
    const brand = await Brand.findByIdAndDelete(request.params.id);
    if (!brand) {
      response.status(404).json({ message: "Brand not found." });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/banners", async (_request, response, next) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ sortOrder: 1 }).lean();
    response.json({ banners });
  } catch (error) {
    next(error);
  }
});

router.get("/banners/admin", requireAuth, requireRole("admin"), async (_request, response, next) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1 }).lean();
    response.json({ banners });
  } catch (error) {
    next(error);
  }
});

router.post("/banners", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    const { title, image, href = "", placement = "home", sortOrder = 0 } = request.body ?? {};
    if (
      !validText(title, 160) ||
      !validText(image, 2048) ||
      typeof href !== "string" ||
      href.length > 2048 ||
      !["home", "category"].includes(placement) ||
      !Number.isInteger(sortOrder)
    ) {
      response.status(400).json({ message: "Banner details are invalid." });
      return;
    }
    const banner = await Banner.create({ title: title.trim(), image, href, placement, sortOrder });
    response.status(201).json({ banner });
  } catch (error) {
    next(error);
  }
});

router.delete("/banners/:id", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(400).json({ message: "Banner id is invalid." });
      return;
    }
    const banner = await Banner.findByIdAndDelete(request.params.id);
    if (!banner) {
      response.status(404).json({ message: "Banner not found." });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/settings", async (_request, response, next) => {
  try {
    const settings = await WebsiteSettings.findOne({ key: "main" }).lean();
    response.json({
      settings: {
        siteName: settings?.siteName ?? "Omni Baby",
        shippingFee: settings?.shippingFee ?? (Number(process.env.SHIPPING_FEE) || 80),
        freeShippingThreshold:
          settings?.freeShippingThreshold ??
          (Number(process.env.FREE_SHIPPING_THRESHOLD) || 1500),
        contactEmail: settings?.contactEmail ?? "",
        contactPhone: settings?.contactPhone ?? "",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put("/settings", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    const { siteName, shippingFee, freeShippingThreshold, contactEmail, contactPhone } =
      request.body ?? {};
    if (
      !validText(siteName, 120) ||
      !Number.isFinite(shippingFee) ||
      Number(shippingFee) < 0 ||
      !Number.isFinite(freeShippingThreshold) ||
      Number(freeShippingThreshold) < 0 ||
      typeof contactEmail !== "string" ||
      contactEmail.length > 254 ||
      typeof contactPhone !== "string" ||
      contactPhone.length > 32
    ) {
      response.status(400).json({ message: "Store settings are invalid." });
      return;
    }
    const settings = await WebsiteSettings.findOneAndUpdate(
      { key: "main" },
      {
        siteName: siteName.trim(),
        shippingFee: Number(shippingFee),
        freeShippingThreshold: Number(freeShippingThreshold),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
      },
      { new: true, upsert: true, runValidators: true },
    );
    response.json({
      settings: {
        siteName: settings.siteName,
        shippingFee: settings.shippingFee,
        freeShippingThreshold: settings.freeShippingThreshold,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
