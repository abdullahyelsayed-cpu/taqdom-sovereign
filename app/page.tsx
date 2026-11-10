import { Preloader } from "@/components/preloader";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/sections/hero-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { FeaturedProductsSection } from "@/components/sections/featured-products-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { CollectionSection } from "@/components/sections/collection-section";
import { EditorialSection } from "@/components/sections/editorial-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { GraduationCreditsSection } from "@/components/sections/graduation-credits-section";
import { FooterSection } from "@/components/sections/footer-section";

export default function Home() {
  return (
    <main className="home-experience min-h-screen bg-background text-foreground">
      <Preloader />
      <Header />
      <HeroSection />
      <div data-reveal="01"><PhilosophySection /></div>
      <div data-reveal="02"><FeaturedProductsSection /></div>
      <div data-reveal="03"><TechnologySection /></div>
      <div data-reveal="04"><GallerySection /></div>
      <div data-reveal="05"><CollectionSection /></div>
      <div data-reveal="06"><EditorialSection /></div>
      <div data-reveal="07"><TestimonialsSection /></div>
      <div data-reveal="08"><GraduationCreditsSection /></div>
      <div data-reveal="09"><FooterSection /></div>
    </main>
  );
}
