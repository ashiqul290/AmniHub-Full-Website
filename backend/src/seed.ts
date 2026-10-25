import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./modules/ecommerce/models/User.js";
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

  console.log("Demo admin, seller, and store are ready. No products were seeded.");
} finally {
  await mongoose.disconnect();
}
