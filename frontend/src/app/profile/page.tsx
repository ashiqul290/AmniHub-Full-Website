import type { Metadata } from "next";
import { ProfilePageContent } from "@/components/auth/auth-pages";

export const metadata: Metadata = {
  title: "Profile | OmniHub",
  description: "Your OmniHub profile preview.",
};

export default function ProfilePage() {
  return <ProfilePageContent />;
}
