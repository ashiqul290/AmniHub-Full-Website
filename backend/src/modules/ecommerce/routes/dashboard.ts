import { Router } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/seller", requireAuth, requireRole("seller"), async (_request, response, next) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(response.locals.user?.id);
    const [products, orders] = await Promise.all([
      Product.find({ seller: sellerId }).lean(),
      Order.find({ "items.seller": sellerId }).lean(),
    ]);
    const sellerItems = orders.flatMap((order) =>
      order.items.filter((item) => String(item.seller) === String(sellerId)),
    );
    response.json({
      stats: {
        products: products.length,
        orders: sellerItems.length,
        revenue: sellerItems
          .filter((item) => item.status !== "cancelled")
          .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        lowStock: products.filter((product) => product.stock < 5).length,
      },
      products,
      orders: orders.map((order) => ({
        ...order,
        items: order.items.filter((item) => String(item.seller) === String(sellerId)),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/admin", requireAuth, requireRole("admin"), async (_request, response, next) => {
  try {
    const [products, customers, sellers, orders, sales] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "seller" }),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);
    const pendingSellers = await User.find({ role: "seller", sellerStatus: "pending" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    response.json({
      stats: { products, customers, sellers, orders, revenue: sales[0]?.total ?? 0 },
      pendingSellers,
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/admin/sellers/:sellerId",
  requireAuth,
  requireRole("admin"),
  async (request, response, next) => {
    try {
      const { sellerId } = request.params;
      const { status } = request.body ?? {};
      if (
        !mongoose.isValidObjectId(sellerId) ||
        !["approved", "rejected"].includes(status)
      ) {
        response.status(400).json({ message: "Choose a valid seller status." });
        return;
      }
      const seller = await User.findOneAndUpdate(
        { _id: sellerId, role: "seller" },
        { sellerStatus: status },
        { new: true, runValidators: true },
      ).select("name email sellerStatus");
      if (!seller) {
        response.status(404).json({ message: "Seller account not found." });
        return;
      }
      response.json({ seller });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
