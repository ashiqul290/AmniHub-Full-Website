import type { Metadata } from "next";
import { JobDetails } from "@/features/jobs/jobs-platform";

export const metadata: Metadata = {
  title: "Job details | OmniHub Jobs",
  description: "Explore job requirements, company details, and application information.",
};

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobDetails id={id} />;
}
