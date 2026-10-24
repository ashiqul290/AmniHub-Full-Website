import User from "../models/User.js";

export async function getActiveSellerIds() {
  return User.find({
    $or: [
      { role: "admin" },
      { role: "seller", sellerStatus: "approved" },
    ],
  }).distinct("_id");
}
