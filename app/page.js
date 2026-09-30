import Link from "next/link";

export default function Home() {
  return (
    <main className="home-page">
      <header className="home-header">
        <Link className="home-brand" href="/">Best films, 1990s–2020s</Link>
      </header>
      <section className="home-hero" aria-labelledby="home-title">
        <p className="eyebrow">A curated collection</p>
        <h1 id="home-title">Discover the defining films of the last four decades.</h1>
        <p>Browse standout films from the 1990s through the 2020s, filter each collection, and find your next favorite.</p>
        <Link className="home-cta" href="/login">Sign in with Google</Link>
      </section>
    </main>
  );
}
