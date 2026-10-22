import {
  BenefitsSection,
  FeaturedSection,
  FeatureSection,
  HeroSection,
  SiteFooter,
  SiteHeader,
} from "@/components/homepage/homepage-sections";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <FeatureSection />
        <FeaturedSection />
        <BenefitsSection />
      </main>
      <SiteFooter />
    </>
  );
}
