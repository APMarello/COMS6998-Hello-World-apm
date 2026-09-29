import LoginButton from "./LoginButton";

export const metadata = { title: "Sign in | Best Movies 2000–2010" };

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">Best movies 2000–2010</p>
        <h1 id="login-title">Sign in to browse the collection</h1>
        <p className="login-copy">Use your Google account to access the movie list.</p>
        <LoginButton />
      </section>
    </main>
  );
}
