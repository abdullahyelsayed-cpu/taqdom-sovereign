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
      <div data-reveal="1"><PhilosophySection /></div>
      <div data-reveal="2"><FeaturedProductsSection /></div>
      <div data-reveal="3"><TechnologySection /></div>
      <div data-reveal="4"><GallerySection /></div>
      <div data-reveal="5"><CollectionSection /></div>
      <div data-reveal="6"><EditorialSection /></div>
      <div data-reveal="7"><TestimonialsSection /></div>
      <div data-reveal="8"><GraduationCreditsSection /></div>
      <div data-reveal="9"><FooterSection /></div>
    </main>
  );
}
