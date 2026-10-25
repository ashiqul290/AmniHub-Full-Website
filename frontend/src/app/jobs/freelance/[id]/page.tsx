import type { Metadata } from "next";
import { FreelanceDetails } from "@/features/jobs/jobs-platform";

export const metadata: Metadata = {
  title: "Freelance project | OmniHub Jobs",
  description: "Explore an independent project and submit a proposal.",
};

export default async function FreelanceProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FreelanceDetails id={id} />;
}
