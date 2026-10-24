import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Product from "./modules/ecommerce/models/Product.js";
import User from "./modules/ecommerce/models/User.js";
import Category from "./modules/ecommerce/models/Category.js";
import Brand from "./modules/ecommerce/models/Brand.js";
import SellerStore from "./modules/ecommerce/models/SellerStore.js";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI must be configured before seeding.");

await mongoose.connect(mongoUri);
try {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await User.updateOne(
      { email: adminEmail },
      {
        $setOnInsert: {
          name: "OmniHub Admin",
          email: adminEmail,
          passwordHash: await bcrypt.hash(adminPassword, 12),
          role: "admin",
          sellerStatus: "approved",
        },
      },
      { upsert: true },
    );
  }

  const sellerEmail = process.env.SEED_SELLER_EMAIL?.trim().toLowerCase();
  const sellerPassword = process.env.SEED_SELLER_PASSWORD;
  if (!sellerEmail || !sellerPassword || sellerPassword.length < 12) {
    throw new Error(
      "Set SEED_SELLER_EMAIL and a SEED_SELLER_PASSWORD of at least 12 characters before seeding.",
    );
  }
  let seller = await User.findOne({ email: sellerEmail });
  if (!seller) {
    seller = await User.create({
      name: "OmniHub Market",
      email: sellerEmail,
      passwordHash: await bcrypt.hash(sellerPassword, 12),
      role: "seller",
      sellerStatus: "approved",
    });
  }
  if (seller.role !== "seller" || seller.sellerStatus !== "approved") {
    throw new Error("SEED_SELLER_EMAIL must belong to an approved seller account.");
  }

  await SellerStore.updateOne(
    { owner: seller._id },
    {
      $setOnInsert: {
        owner: seller._id,
        name: "OmniHub Market",
        slug: `omnihub-market-${String(seller._id).slice(-6)}`,
        description: "A curated collection of useful, well-made everyday goods.",
        email: sellerEmail,
        status: "approved",
      },
    },
    { upsert: true },
  );

  const samples = [
    ["Everyday Canvas Tote", "A durable carry-all for work, errands, and weekends.", "Accessories", "Northstar", 28, 39, 24, "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85"],
    ["Studio Wireless Headphones", "Balanced sound and all-day comfort in a compact design.", "Electronics", "Soundform", 89, 119, 18, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85"],
    ["Ceramic Pour-over Set", "A thoughtfully made brewer and mug set for slow mornings.", "Home", "Hearth & Hand", 42, 54, 12, "https://images.unsplash.com/photo-1517256673644-36ad11246d21?auto=format&fit=crop&w=900&q=85"],
    ["Trail Runner Sneakers", "Lightweight everyday sneakers with a cushioned sole.", "Fashion", "Pace", 74, 98, 31, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85"],
    ["Minimal Desk Lamp", "Warm, adjustable lighting in a clean aluminum silhouette.", "Home", "Form Objects", 56, 72, 9, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85"],
    ["Everyday Analog Watch", "A refined stainless steel watch made for daily wear.", "Accessories", "Meridian", 112, 145, 15, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85"],
  ] as const;
  for (const category of new Set(samples.map((sample) => sample[2]))) {
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await Category.updateOne(
      { slug },
      { $setOnInsert: { name: category, slug, active: true } },
      { upsert: true },
    );
  }
  for (const brand of new Set(samples.map((sample) => sample[3]))) {
    const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await Brand.updateOne(
      { slug },
      { $setOnInsert: { name: brand, slug, active: true } },
      { upsert: true },
    );
  }
  for (const [name, description, category, brand, price, compareAtPrice, stock, image] of samples) {
    await Product.updateOne(
      { name, seller: seller._id },
      {
        $setOnInsert: {
          name,
          description,
          category,
          brand,
          price,
          compareAtPrice,
          stock,
          images: [image],
          rating: 0,
          reviewCount: 0,
          status: "active",
          seller: seller._id,
        },
      },
      { upsert: true },
    );
  }
  console.log("E-commerce demo catalog is ready.");
} finally {
  await mongoose.disconnect();
}
