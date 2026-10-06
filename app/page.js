import Link from "next/link";

export default function Home() {
  return (
    <main className="home-page">
      <header className="home-header">
        <Link className="home-brand" href="/">AI Humor App</Link>
      </header>
      <section className="home-hero" aria-labelledby="home-title">
        <h1 id="home-title">AI Humor App</h1>
        <p>Discover AI-generated memes, rate the ones that make you laugh, and see what the community finds funniest.</p>
        <Link className="home-cta" href="/login">Sign in with Google</Link>
      </section>
    </main>
  );
}
