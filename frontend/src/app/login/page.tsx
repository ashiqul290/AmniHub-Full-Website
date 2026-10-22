import type { Metadata } from "next";
import { LoginPageContent } from "@/components/auth/auth-pages";

export const metadata: Metadata = {
  title: "Sign In | OmniHub",
  description: "Sign in to continue to OmniHub.",
};

export default function LoginPage() {
  return <LoginPageContent />;
}
