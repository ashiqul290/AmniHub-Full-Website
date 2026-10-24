import type { Metadata } from "next";
import { ProductDetail } from "@/features/ecommerce/product-detail";

export const metadata: Metadata = { title: "Product | Omni Market" };

export default function ProductPage() {
  return <ProductDetail />;
}
