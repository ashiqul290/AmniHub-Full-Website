import type { Metadata } from "next";
import { SeekerDashboard } from "@/features/jobs/jobs-platform";

export const metadata: Metadata = {
  title: "Job seeker dashboard | OmniHub Jobs",
};

export default function JobSeekerDashboardPage() {
  return <SeekerDashboard />;
}
