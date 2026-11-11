import { Header } from "@/components/header";
import { TaqdomWorldExperience } from "@/components/homepage/taqdom-world";

export default function Home() {
  return (
    <main className="home-experience min-h-screen bg-background text-foreground">
      <Header />
      <TaqdomWorldExperience />
    </main>
  );
}
