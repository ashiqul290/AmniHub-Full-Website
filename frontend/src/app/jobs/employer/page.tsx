import type { Metadata } from "next";
import { EmployerDashboard } from "@/features/jobs/jobs-platform";

export const metadata: Metadata = {
  title: "Employer dashboard | OmniHub Jobs",
};

export default function EmployerDashboardPage() {
  return <EmployerDashboard />;
}
