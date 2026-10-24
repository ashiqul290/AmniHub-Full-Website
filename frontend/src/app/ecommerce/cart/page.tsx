import type { Metadata } from "next";
import { Marketplace } from "@/features/ecommerce/marketplace";

export const metadata: Metadata = { title: "Your Bag | Omni Market" };

export default function CartPage() {
  return <Marketplace mode="cart" />;
}
