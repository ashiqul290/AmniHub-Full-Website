import { Router } from "express";
import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import Banner from "../models/Banner.js";
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

router.get("/banners", async (_request, response, next) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ sortOrder: 1 }).lean();
    response.json({ banners });
  } catch (error) {
    next(error);
  }
});

export default router;
