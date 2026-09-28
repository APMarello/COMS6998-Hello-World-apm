# Best Movies 2000–2010

A Next.js app that displays rows from the Supabase `Best_2000-2010_movies` table.

The movie collection is protected by Supabase Auth. Visitors must sign in with
Google before any data is loaded.

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

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

Also add the matching production URL before deploying. Google itself should use
the Supabase callback URL shown in the Google provider settings, not this app
callback URL.
