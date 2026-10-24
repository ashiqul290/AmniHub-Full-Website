import type { Metadata } from "next";
import { Marketplace } from "@/features/ecommerce/marketplace";

export const metadata: Metadata = { title: "Your Orders | Omni Market" };

export default function OrdersPage() {
  return <Marketplace mode="orders" />;
}
