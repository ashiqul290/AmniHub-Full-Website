import type { Metadata } from "next";
import { Marketplace } from "@/features/ecommerce/marketplace";

export const metadata: Metadata = {
  title: "Omni Market | OmniHub",
  description: "Discover thoughtful finds from independent brands and makers.",
};

export default function EcommercePage() {
  return <Marketplace />;
}
