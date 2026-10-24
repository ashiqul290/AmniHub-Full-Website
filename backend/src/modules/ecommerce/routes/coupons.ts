import { Router } from "express";
import Coupon from "../models/Coupon.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { getActiveSellerIds } from "../services/sellers.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/validate", requireAuth, async (request, response, next) => {
  try {
    const code =
      typeof request.body?.code === "string"
        ? request.body.code.trim().toUpperCase()
        : "";
    if (!code || code.length > 40) {
      response.status(400).json({ message: "Enter a valid coupon code." });
      return;
    }
    const cart = await Cart.findOne({ user: response.locals.user?.id }).lean();
    if (!cart?.items.length) {
      response.status(400).json({ message: "Add products to your bag before applying a coupon." });
      return;
    }
    const products = await Product.find({
      _id: { $in: cart.items.map((line) => line.product) },
      status: "active",
      seller: { $in: await getActiveSellerIds() },
    })
      .select("price")
      .lean();
    const prices = new Map(products.map((product) => [String(product._id), product.price]));
    const subtotal = cart.items.reduce(
      (sum, line) => sum + (prices.get(String(line.product)) ?? 0) * line.quantity,
      0,
    );
    const coupon = await Coupon.findOne({
      code,
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      $expr: {
        $or: [
          { $eq: [{ $ifNull: ["$maxUses", null] }, null] },
          { $lt: ["$usedCount", "$maxUses"] },
        ],
      },
    }).lean();
    if (!coupon) {
      response.status(404).json({ message: "This coupon is invalid, expired, or no longer available." });
      return;
    }
    if (subtotal < coupon.minimumOrder) {
      response.status(400).json({
        message: `This coupon requires an order of at least $${coupon.minimumOrder.toFixed(2)}.`,
      });
      return;
    }
    const discount = Math.min(
      subtotal,
      Math.round(
        (coupon.discountType === "percent"
          ? (subtotal * coupon.value) / 100
          : coupon.value) * 100,
      ) / 100,
    );
    response.json({ code: coupon.code, discount, subtotal });
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAuth, requireRole("admin"), async (_request, response, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    response.json({ coupons });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireRole("admin"), async (request, response, next) => {
  try {
    const { code, discountType, value, minimumOrder = 0, maxUses, expiresAt } =
      request.body ?? {};
    if (
      typeof code !== "string" ||
      !/^[a-z0-9_-]{3,40}$/i.test(code.trim()) ||
      !["percent", "fixed"].includes(discountType) ||
      !Number.isFinite(value) ||
      Number(value) <= 0 ||
      (discountType === "percent" && Number(value) > 100) ||
      !Number.isFinite(minimumOrder) ||
      Number(minimumOrder) < 0 ||
      (maxUses !== undefined && (!Number.isInteger(maxUses) || Number(maxUses) < 1)) ||
      (expiresAt !== undefined && !Number.isFinite(Date.parse(expiresAt)))
    ) {
      response.status(400).json({ message: "Coupon details are invalid." });
      return;
    }
    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType,
      value: Number(value),
      minimumOrder: Number(minimumOrder),
      ...(maxUses === undefined ? {} : { maxUses: Number(maxUses) }),
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
    });
    response.status(201).json({ coupon });
  } catch (error) {
    next(error);
  }
});

export default router;
