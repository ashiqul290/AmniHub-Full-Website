import type { Metadata } from "next";
import { JobsAdminDashboard } from "@/features/jobs/jobs-platform";

export const metadata: Metadata = {
  title: "Jobs administration | OmniHub",
};

export default function JobsAdminPage() {
  return <JobsAdminDashboard />;
}
