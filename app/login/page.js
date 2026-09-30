import LoginButton from "./LoginButton";

export const metadata = { title: "Sign in | Best Films, 1990s–2020s" };

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">Best films, 1990s–2020s</p>
        <h1 id="login-title">Sign in to browse the collection</h1>
        <p className="login-copy">Use your Google account to access the movie list.</p>
        <LoginButton />
      </section>
    </main>
  );
}
