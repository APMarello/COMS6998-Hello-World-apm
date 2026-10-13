import Link from "next/link";
import LandingHero from "./LandingHero";

export default function Home() {
  return (
    <main className="home-page">
      <header className="home-header">
        <Link className="home-brand" href="/">AI Humor App</Link>
      </header>
      <LandingHero />
    </main>
  );
}
