import type { Metadata } from "next";
import { LogoutPage } from "@/features/ecommerce/logout";

export const metadata: Metadata = { title: "Sign Out | Omni Market" };

export default function SignOutPage() {
  return <LogoutPage />;
}
