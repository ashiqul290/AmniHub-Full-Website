import { Router } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { getActiveSellerIds } from "../services/sellers.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:productId", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.productId)) {
      response.status(400).json({ message: "Product id is invalid." });
      return;
    }
    const reviews = await Review.find({
      product: request.params.productId,
      status: "published",
    })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    response.json({ reviews });
  } catch (error) {
    next(error);
  }
});

router.post("/:productId", requireAuth, async (request, response, next) => {
  try {
    const { productId } = request.params;
    const { rating, title, comment } = request.body ?? {};
    const userId = response.locals.user?.id;
    if (
      typeof productId !== "string" ||
      !mongoose.isValidObjectId(productId) ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      typeof comment !== "string" ||
      comment.trim().length < 3 ||
      comment.length > 2000 ||
      (title !== undefined && (typeof title !== "string" || title.length > 120))
    ) {
      response.status(400).json({ message: "Enter a rating and review of at least 3 characters." });
      return;
    }
    const product = await Product.findOne({
      _id: productId,
      status: "active",
      seller: { $in: await getActiveSellerIds() },
    });
    if (!product) {
      response.status(404).json({ message: "Product not found." });
      return;
    }
    const purchased = await Order.exists({
      user: userId,
      items: { $elemMatch: { product: productId, status: "delivered" } },
    });
    if (!purchased) {
      response.status(403).json({ message: "Only customers with a delivered order can review this product." });
      return;
    }
    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      title: typeof title === "string" ? title.trim() : "",
      comment: comment.trim(),
    });
    const [aggregate] = await Review.aggregate([
      { $match: { product: product._id, status: "published" } },
      { $group: { _id: null, rating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    await Product.updateOne(
      { _id: product._id },
      { rating: aggregate?.rating ?? 0, reviewCount: aggregate?.count ?? 0 },
    );
    response.status(201).json({ review });
  } catch (error) {
    next(error);
  }
});

export default router;
