import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { SortOrder } from "mongoose";
import { getActiveSellerIds } from "../services/sellers.js";

const router = Router();
const validProductInput = (body: Record<string, unknown>) =>
  typeof body.name === "string" &&
  body.name.trim().length > 1 &&
  typeof body.description === "string" &&
  body.description.trim().length > 0 &&
  typeof body.category === "string" &&
  Number.isFinite(body.price) &&
  Number(body.price) >= 0 &&
  Number.isInteger(body.stock) &&
  Number(body.stock) >= 0 &&
  (body.brand === undefined ||
    (typeof body.brand === "string" && body.brand.length <= 80)) &&
  (body.compareAtPrice === undefined ||
    (Number.isFinite(body.compareAtPrice) && Number(body.compareAtPrice) >= 0)) &&
  (body.images === undefined ||
    (Array.isArray(body.images) &&
      body.images.length <= 8 &&
      body.images.every(
        (image) => typeof image === "string" && image.length <= 2048,
      )));

const productFields = [
  "name",
  "description",
  "category",
  "brand",
  "price",
  "compareAtPrice",
  "stock",
  "images",
] as const;
const allowedProductFields = (body: Record<string, unknown>) =>
  Object.fromEntries(
    productFields
      .filter((field) => Object.hasOwn(body, field))
      .map((field) => [field, body[field]]),
  );

router.get("/", async (request, response, next) => {
  try {
    const page = Math.max(1, Number.parseInt(String(request.query.page || "1"), 10) || 1);
    const limit = Math.min(
      48,
      Math.max(1, Number.parseInt(String(request.query.limit || "12"), 10) || 12),
    );
    const minPrice = Number(request.query.minPrice);
    const maxPrice = Number(request.query.maxPrice);
    const filter: Record<string, unknown> = { status: "active" };
    filter.seller = { $in: await getActiveSellerIds() };
    if (typeof request.query.category === "string") filter.category = request.query.category;
    if (typeof request.query.brand === "string") filter.brand = request.query.brand;
    if (Number.isFinite(minPrice)) filter.price = { $gte: minPrice };
    if (Number.isFinite(maxPrice)) {
      filter.price = { ...(filter.price as object), $lte: maxPrice };
    }
    if (typeof request.query.q === "string" && request.query.q.trim()) {
      filter.$text = { $search: request.query.q.trim().slice(0, 100) };
    }
    const sort: Record<string, SortOrder> =
      request.query.sort === "price-asc"
        ? { price: 1 }
        : request.query.sort === "price-desc"
          ? { price: -1 }
          : request.query.sort === "rating"
            ? { rating: -1, reviewCount: -1 }
            : { createdAt: -1 };
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    response.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.get("/mine", requireAuth, requireRole("seller"), async (_request, response, next) => {
  try {
    const products = await Product.find({ seller: response.locals.user?.id })
      .sort({ createdAt: -1 })
      .lean();
    response.json({ products });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!validProductInput(request.body ?? {})) {
      response.status(400).json({ message: "Product details are invalid." });
      return;
    }
    const product = await Product.create({
      ...allowedProductFields(request.body),
      seller: response.locals.user?.id,
      status: "active",
    });
    response.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: "Product not found." });
      return;
    }
    const product = await Product.findOne({
      _id: request.params.id,
      status: "active",
      seller: { $in: await getActiveSellerIds() },
    }).lean();
    if (!product) {
      response.status(404).json({ message: "Product not found." });
      return;
    }
    response.json({ product });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) || !validProductInput(request.body ?? {})) {
      response.status(400).json({ message: "Product details are invalid." });
      return;
    }
    const filter =
      response.locals.user?.role === "admin"
        ? { _id: request.params.id }
        : { _id: request.params.id, seller: response.locals.user?.id };
    const product = await Product.findOneAndUpdate(
      filter,
      allowedProductFields(request.body),
      {
      new: true,
      runValidators: true,
      },
    );
    if (!product) {
      response.status(404).json({ message: "Product not found in your store." });
      return;
    }
    response.json({ product });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, requireRole("seller", "admin"), async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(404).json({ message: "Product not found." });
      return;
    }
    const filter =
      response.locals.user?.role === "admin"
        ? { _id: request.params.id }
        : { _id: request.params.id, seller: response.locals.user?.id };
    const product = await Product.findOneAndDelete(filter);
    if (!product) {
      response.status(404).json({ message: "Product not found in your store." });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
