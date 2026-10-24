import { Router } from "express";
import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
import { getActiveSellerIds } from "../services/sellers.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_request, response, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: response.locals.user?.id })
      .populate({
        path: "products",
        match: { status: "active", seller: { $in: await getActiveSellerIds() } },
      })
      .lean();
    response.json({ products: wishlist?.products ?? [] });
  } catch (error) {
    next(error);
  }
});

router.put("/:productId", async (request, response, next) => {
  try {
    const { productId } = request.params;
    if (!mongoose.isValidObjectId(productId)) {
      response.status(400).json({ message: "Product id is invalid." });
      return;
    }
    const product = await Product.exists({
      _id: productId,
      status: "active",
      seller: { $in: await getActiveSellerIds() },
    });
    if (!product) {
      response.status(404).json({ message: "Product not found." });
      return;
    }
    await Wishlist.findOneAndUpdate(
      { user: response.locals.user?.id },
      { $setOnInsert: { user: response.locals.user?.id }, $addToSet: { products: productId } },
      { upsert: true, new: true, runValidators: true },
    );
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.delete("/:productId", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.productId)) {
      response.status(400).json({ message: "Product id is invalid." });
      return;
    }
    await Wishlist.updateOne(
      { user: response.locals.user?.id },
      { $pull: { products: request.params.productId } },
    );
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
