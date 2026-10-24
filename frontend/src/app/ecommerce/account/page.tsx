import type { Metadata } from "next";
import { AccountDashboard } from "@/features/ecommerce/account";

export const metadata: Metadata = { title: "My Account | Omni Market" };

export default function AccountPage() {
  return <AccountDashboard />;
}
