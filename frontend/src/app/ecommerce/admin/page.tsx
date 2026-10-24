import type { Metadata } from "next";
import { Marketplace } from "@/features/ecommerce/marketplace";

export const metadata: Metadata = { title: "Marketplace Admin | Omni Market" };

export default function AdminPage() {
  return <Marketplace mode="admin" />;
}
