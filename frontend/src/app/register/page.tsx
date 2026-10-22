import type { Metadata } from "next";
import { RegistrationPageContent } from "@/components/auth/auth-pages";

export const metadata: Metadata = {
  title: "Create Account | OmniHub",
  description: "Join OmniHub and explore endless possibilities.",
};

export default function RegisterPage() {
  return <RegistrationPageContent />;
}
