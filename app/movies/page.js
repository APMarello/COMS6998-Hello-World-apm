import DashboardTabs from "../DashboardTabs";
import { createClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const DECADES = [
  { id: "1990s", label: "1990s", tableName: "Best_1990s" },
  { id: "2000s", label: "2000s", tableName: "Best_2000s" },
  { id: "2010s", label: "2010s", tableName: "Best_2010s" },
  { id: "2020s", label: "2020s", tableName: "Best_2020s" },
];

async function getMovies(supabase, tableName) {
  const { data, error } = await supabase.from(tableName).select("*");

  if (error) throw new Error(error.message);
  return data;
}

export default async function MoviesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const decadeResults = await Promise.all(DECADES.map(async (decade) => {
    try {
      const movies = await getMovies(supabase, decade.tableName);
      return { ...decade, movies, columns: movies.length ? Object.keys(movies[0]) : [], error: null };
    } catch (caughtError) {
      return { ...decade, movies: [], columns: [], error: caughtError.message };
    }
  }));

  return (
    <main>
      <section className="movies" aria-labelledby="page-title">
        <DashboardTabs
          decades={decadeResults}
          user={{ id: user.id, email: user.email, user_metadata: user.user_metadata ?? {} }}
        />
      </section>
    </main>
  );
}
