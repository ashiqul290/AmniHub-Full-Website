import { Router } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Payment from "../models/Payment.js";
import { getActiveSellerIds } from "../services/sellers.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/", async (request, response, next) => {
  const session = await mongoose.startSession();
  try {
    const address = request.body?.shippingAddress;
    const couponCode =
      typeof request.body?.couponCode === "string"
        ? request.body.couponCode.trim().toUpperCase()
        : "";
    const requiredFields = ["name", "phone", "line1", "city", "postalCode", "country"];
    if (
      !address ||
      requiredFields.some(
        (field) =>
          typeof address[field] !== "string" ||
          address[field].trim().length === 0 ||
          address[field].trim().length > 160,
      ) ||
      request.body?.paymentMethod !== "cod"
    ) {
      response.status(400).json({ message: "Enter a complete delivery address and select cash on delivery." });
      return;
    }

    let createdOrder: InstanceType<typeof Order> | undefined;
    const activeSellerIds = await getActiveSellerIds();
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: response.locals.user?.id }).session(session);
      if (!cart || cart.items.length === 0) {
        throw Object.assign(new Error("Your cart is empty."), { statusCode: 400 });
      }

      const orderItems = [];
      let subtotal = 0;
      for (const line of cart.items) {
        const product = await Product.findOneAndUpdate(
          {
            _id: line.product,
            status: "active",
            seller: { $in: activeSellerIds },
            stock: { $gte: line.quantity },
          },
          { $inc: { stock: -line.quantity } },
          { new: true, session },
        );
        if (!product) {
          throw Object.assign(new Error("A product in your cart is out of stock. Please review your cart."), {
            statusCode: 409,
          });
        }
        subtotal += product.price * line.quantity;
        orderItems.push({
          product: product._id,
          seller: product.seller,
          name: product.name,
          image: product.images[0] ?? "",
          unitPrice: product.price,
          quantity: line.quantity,
        });
      }
      let discount = 0;
      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode,
          active: true,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
          $expr: {
            $or: [
              { $eq: [{ $ifNull: ["$maxUses", null] }, null] },
              { $lt: ["$usedCount", "$maxUses"] },
            ],
          },
        }).session(session);
        if (!coupon) {
          throw Object.assign(new Error("This coupon is invalid, expired, or no longer available."), {
            statusCode: 400,
          });
        }
        if (subtotal < coupon.minimumOrder) {
          throw Object.assign(
            new Error(`This coupon requires an order of at least $${coupon.minimumOrder.toFixed(2)}.`),
            { statusCode: 400 },
          );
        }
        discount =
          coupon.discountType === "percent"
            ? (subtotal * coupon.value) / 100
            : coupon.value;
        discount = Math.min(subtotal, Math.round(discount * 100) / 100);
        const updatedCoupon = await Coupon.findOneAndUpdate(
          {
            _id: coupon._id,
            active: true,
            $or: [{ maxUses: null }, { $expr: { $gt: ["$maxUses", "$usedCount"] } }],
          },
          { $inc: { usedCount: 1 } },
          { new: true, session },
        );
        if (!updatedCoupon) {
          throw Object.assign(new Error("This coupon has reached its usage limit."), {
            statusCode: 409,
          });
        }
      }
      subtotal = Math.round(subtotal * 100) / 100;
      const configuredShipping = Number(process.env.SHIPPING_FEE);
      const shippingFee =
        Number.isFinite(configuredShipping) && configuredShipping >= 0
          ? configuredShipping
          : 8;
      const configuredFreeShipping = Number(process.env.FREE_SHIPPING_THRESHOLD);
      const freeShippingThreshold =
        Number.isFinite(configuredFreeShipping) && configuredFreeShipping >= 0
          ? configuredFreeShipping
          : 75;
      const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
      [createdOrder] = await Order.create(
        [
          {
            user: response.locals.user?.id,
            items: orderItems,
            shippingAddress: Object.fromEntries(
              requiredFields.map((field) => [field, address[field].trim()]),
            ),
            subtotal,
            shipping,
            discount,
            couponCode,
            total: Math.round((subtotal + shipping - discount) * 100) / 100,
            paymentMethod: "cod",
          },
        ],
        { session },
      );
      await Payment.create(
        [
          {
            order: createdOrder._id,
            user: response.locals.user?.id,
            method: "cod",
            status: "pending",
            amount: createdOrder.total,
          },
        ],
        { session },
      );
      cart.items.splice(0, cart.items.length);
      await cart.save({ session });
    });
    response.status(201).json({ order: createdOrder });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

router.get("/mine", async (_request, response, next) => {
  try {
    const orders = await Order.find({ user: response.locals.user?.id })
      .sort({ createdAt: -1 })
      .lean();
    response.json({ orders });
  } catch (error) {
    next(error);
  }
});

router.get("/admin", requireRole("admin"), async (request, response, next) => {
  try {
    const page = Math.max(1, Number.parseInt(String(request.query.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(request.query.limit || "50"), 10) || 50));
    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      Order.countDocuments(),
    ]);
    response.json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/:orderId/status", requireRole("admin"), async (request, response, next) => {
  const session = await mongoose.startSession();
  try {
    const { orderId } = request.params;
    const { status } = request.body ?? {};
    if (
      !mongoose.isValidObjectId(orderId) ||
      !["shipped", "delivered", "cancelled"].includes(status)
    ) {
      response.status(400).json({ message: "Order status is invalid." });
      return;
    }
    let updated: InstanceType<typeof Order> | null = null;
    if (status === "cancelled") {
      await session.withTransaction(async () => {
        updated = await Order.findOneAndUpdate(
          { _id: orderId, status: "processing" },
          { $set: { status: "cancelled", "items.$[].status": "cancelled" } },
          { new: true, session },
        );
        if (!updated) return;
        for (const item of updated.items) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session },
          );
        }
        await Payment.updateOne(
          { order: updated._id, status: "pending" },
          { $set: { status: "failed" } },
          { session },
        );
      });
    } else {
      const previous = status === "shipped" ? "processing" : "shipped";
      updated = await Order.findOneAndUpdate(
        { _id: orderId, status: previous },
        { $set: { status, "items.$[].status": status } },
        { new: true },
      );
    }
    if (!updated) {
      response.status(409).json({ message: "Order not found or its current status does not allow this update." });
      return;
    }
    response.json({ order: updated });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
});

router.get("/seller", requireRole("seller"), async (_request, response, next) => {
  try {
    const orders = await Order.find({ "items.seller": response.locals.user?.id })
      .sort({ createdAt: -1 })
      .lean();
    response.json({
      orders: orders.map((order) => ({
        ...order,
        items: order.items.filter((item) => String(item.seller) === response.locals.user?.id),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:orderId/items/:productId/status", requireRole("seller"), async (request, response, next) => {
  try {
    const { orderId, productId } = request.params;
    const { status } = request.body ?? {};
    if (
      !mongoose.isValidObjectId(orderId) ||
      !mongoose.isValidObjectId(productId) ||
      !["shipped", "delivered"].includes(status)
    ) {
      response.status(400).json({ message: "Order update is invalid." });
      return;
    }
    const previousStatus = status === "shipped" ? "processing" : "shipped";
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        items: {
          $elemMatch: {
            product: productId,
            seller: response.locals.user?.id,
            status: previousStatus,
          },
        },
      },
      { $set: { "items.$[line].status": status } },
      {
        new: true,
        arrayFilters: [
          {
            "line.product": productId,
            "line.seller": response.locals.user?.id,
            "line.status": previousStatus,
          },
        ],
      },
    );
    if (!order) {
      response.status(404).json({ message: "Order item not found in your store." });
      return;
    }
    response.json({ order });
  } catch (error) {
    next(error);
  }
});

router.get("/:orderId", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.orderId)) {
      response.status(404).json({ message: "Order not found." });
      return;
    }
    const order = await Order.findOne({
      _id: request.params.orderId,
      user: response.locals.user?.id,
    }).lean();
    if (!order) {
      response.status(404).json({ message: "Order not found." });
      return;
    }
    response.json({ order });
  } catch (error) {
    next(error);
  }
});

export default router;
