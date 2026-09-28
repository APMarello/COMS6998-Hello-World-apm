import MovieTable from "./MovieTable";
import SignOutButton from "./SignOutButton";
import { createClient } from "../utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const TABLE_NAME = "Best_2000-2010_movies";

async function getMovies(supabase) {
  const { data, error } = await supabase.from(TABLE_NAME).select("*");

  if (error) throw new Error(error.message);
  return data;
}

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // This remains an enforcement point if middleware is ever bypassed.
  if (!user) redirect("/login");

  let movies = [];
  let error = null;

  try {
    movies = await getMovies(supabase);
  } catch (caughtError) {
    error = caughtError.message;
  }

  const columns = movies.length ? Object.keys(movies[0]) : [];

  return (
    <main>
      <section className="movies" aria-labelledby="page-title">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Supabase collection</p>
            <h1 id="page-title">Best movies of 2000–2010</h1>
          </div>
          <div className="account-controls">
            <span className="user-email">{user.email}</span>
            <SignOutButton />
          </div>
        </div>

        {error ? (
          <p className="status error" role="alert">Couldn’t load the movie list: {error}</p>
        ) : movies.length === 0 ? (
          <p className="status">No movies found in {TABLE_NAME}.</p>
        ) : (
          <MovieTable movies={movies} columns={columns} />
        )}
      </section>
    </main>
  );
}
