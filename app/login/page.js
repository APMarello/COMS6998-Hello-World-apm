import LoginButton from "./LoginButton";

export const metadata = { title: "Sign in | AI Humor App" };

export default function LoginPage({ searchParams }) {
  const domainBlocked = searchParams?.error === "domain";
  const whitelistBlocked = searchParams?.error === "whitelist";

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">AI Humor App</p>
        <h1 id="login-title">Sign in to rate AI-generated memes</h1>
        <p className="login-copy">Use your Google account to join the fun and share your ratings.</p>
        {domainBlocked && <p className="login-error" role="alert">Use a Barnard, Columbia, or Gmail account to sign in.</p>}
        {whitelistBlocked && <p className="login-error" role="alert">Your account is not currently approved to sign in.</p>}
        <LoginButton />
      </section>
    </main>
  );
}
