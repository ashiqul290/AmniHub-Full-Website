import type { Metadata } from "next";
import { Marketplace } from "@/features/ecommerce/marketplace";

export const metadata: Metadata = { title: "Wishlist | Omni Market" };

export default function WishlistPage() {
  return <Marketplace mode="wishlist" />;
}
