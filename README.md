
Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key
```

`GEMINI_API_KEY` is used only by the server to analyze a selected meme photo and generate its caption. Do not prefix it with `NEXT_PUBLIC_`.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Google sign-in redirect URL

In Supabase Authentication → URL Configuration, add the local callback URL to
the Redirect URLs allow list:

```text
http://localhost:3000/auth/callback
```

For production, set `NEXT_PUBLIC_SITE_URL` to the one canonical public app URL
(for example, `https://coms-6998-hello-world-apm.vercel.app`) in the hosting
provider's environment variables. In Supabase Authentication → URL
Configuration, set that same URL as the Site URL and add its callback path to
the Redirect URLs allow list:

```text
https://coms-6998-hello-world-apm.vercel.app/auth/callback
```

Do not use changing Vercel preview URLs as the OAuth callback destination.
Google itself should use the Supabase callback URL shown in the Google provider
settings, not this app callback URL.
