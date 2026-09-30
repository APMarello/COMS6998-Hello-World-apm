import DashboardTabs from "../DashboardTabs";
import { createClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const TABLE_NAME = "Best_2000-2010_movies";

async function getMovies(supabase) {
  const { data, error } = await supabase.from(TABLE_NAME).select("*");

  if (error) throw new Error(error.message);
  return data;
}

export default async function MoviesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
        <DashboardTabs
          movies={movies}
          columns={columns}
          error={error}
          tableName={TABLE_NAME}
          user={{ id: user.id, email: user.email, user_metadata: user.user_metadata ?? {} }}
        />
      </section>
    </main>
  );
}
