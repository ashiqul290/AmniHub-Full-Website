import type { Metadata } from "next";
import { Marketplace } from "@/features/ecommerce/marketplace";

export const metadata: Metadata = { title: "Checkout | Omni Market" };

export default function CheckoutPage() {
  return <Marketplace mode="checkout" />;
}
