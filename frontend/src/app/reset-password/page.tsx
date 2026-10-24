import type { Metadata } from "next";
import { ResetPasswordPageContent } from "@/components/auth/auth-pages";

export const metadata: Metadata = { title: "Choose a New Password | OmniHub" };

export default function ResetPasswordPage() {
  return <ResetPasswordPageContent />;
}
