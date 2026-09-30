import Link from "next/link";

export default function Home() {
  return (
    <main className="home-page">
      <header className="home-header">
        <Link className="home-brand" href="/">Best movies 2000–2010</Link>
      </header>
      <section className="home-hero" aria-labelledby="home-title">
        <p className="eyebrow">A curated collection</p>
        <h1 id="home-title">Discover the best movies of the 2000s.</h1>
        <p>Browse the collection, filter the list, and find your next favorite film.</p>
        <Link className="home-cta" href="/login">Sign in with Google</Link>
      </section>
    </main>
  );
}
