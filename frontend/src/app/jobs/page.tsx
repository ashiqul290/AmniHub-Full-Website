import type { Metadata } from "next";
import { JobsHome } from "@/features/jobs/jobs-platform";

export const metadata: Metadata = {
  title: "Jobs & Careers | OmniHub",
  description: "Find meaningful jobs, explore career opportunities, and connect with great teams.",
};

export default function JobsPage() {
  return <JobsHome />;
}
