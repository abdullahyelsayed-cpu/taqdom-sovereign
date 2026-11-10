import { Header } from "@/components/header";
import { TaqdomReimagined } from "@/components/homepage/taqdom-reimagined";

export default function Home() {
  return (
    <main className="home-experience min-h-screen bg-background text-foreground">
      <Header />
      <TaqdomReimagined />
    </main>
  );
}
