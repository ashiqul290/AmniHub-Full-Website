import type { Metadata } from "next";
import { Marketplace } from "@/features/ecommerce/marketplace";

export const metadata: Metadata = { title: "Seller Studio | Omni Market" };

export default function SellerPage() {
  return <Marketplace mode="seller" />;
}
