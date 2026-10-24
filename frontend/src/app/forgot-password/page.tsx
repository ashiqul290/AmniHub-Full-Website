import type { Metadata } from "next";
import { ForgotPasswordPageContent } from "@/components/auth/auth-pages";

export const metadata: Metadata = { title: "Reset Password | OmniHub" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageContent />;
}
