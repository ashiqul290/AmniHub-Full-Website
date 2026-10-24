import { Router } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
import { getActiveSellerIds } from "../services/sellers.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_request, response, next) => {
  try {
    const cart = await Cart.findOne({ user: response.locals.user?.id })
      .populate({
        path: "items.product",
        match: { status: "active", seller: { $in: await getActiveSellerIds() } },
      })
      .lean();
    response.json({ cart: cart ?? { items: [] } });
  } catch (error) {
    next(error);
  }
});

router.put("/:productId", async (request, response, next) => {
  try {
    const { productId } = request.params;
    const quantity = Number(request.body?.quantity);
    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      response.status(400).json({ message: "Choose a valid product and quantity." });
      return;
    }
    const product = await Product.findOne({
      _id: productId,
      status: "active",
      seller: { $in: await getActiveSellerIds() },
    });
    if (!product) {
      response.status(404).json({ message: "This product is no longer available." });
      return;
    }
    if (quantity > product.stock) {
      response.status(409).json({ message: `Only ${product.stock} left in stock.` });
      return;
    }
    const cart = await Cart.findOneAndUpdate(
      { user: response.locals.user?.id },
      { $setOnInsert: { user: response.locals.user?.id }, $set: { "items.$[line].quantity": quantity } },
      { new: true, upsert: true, arrayFilters: [{ "line.product": product._id }] },
    );
    const existing = cart.items.some((item) => String(item.product) === productId);
    if (!existing) {
      cart.items.push({ product: product._id, quantity });
      await cart.save();
    }
    const populated = await cart.populate("items.product");
    response.json({ cart: populated });
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
    const cart = await Cart.findOneAndUpdate(
      { user: response.locals.user?.id },
      { $pull: { items: { product: request.params.productId } } },
      { new: true },
    ).populate("items.product");
    response.json({ cart: cart ?? { items: [] } });
  } catch (error) {
    next(error);
  }
});

export default router;
