export const dynamic = "force-dynamic";

const TABLE_NAME = "Best_2000-2010_movies";

async function getMovies() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("Supabase environment variables are not configured.");

  const response = await fetch(
    `${url}/rest/v1/${encodeURIComponent(TABLE_NAME)}?select=*`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    },
  );

  if (!response.ok) throw new Error(`Supabase returned ${response.status}.`);
  return response.json();
}

function cellValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function Home() {
  let movies = [];
  let error = null;

  try {
    movies = await getMovies();
  } catch (caughtError) {
    error = caughtError.message;
  }

  const columns = movies.length ? Object.keys(movies[0]) : [];

  return (
    <main>
      <section className="movies" aria-labelledby="page-title">
        <p className="eyebrow">Supabase collection</p>
        <h1 id="page-title">Best movies of 2000–2010</h1>

        {error ? (
          <p className="status error" role="alert">Couldn’t load the movie list: {error}</p>
        ) : movies.length === 0 ? (
          <p className="status">No movies found in {TABLE_NAME}.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>{columns.map((column) => <th key={column} scope="col">{column.replaceAll("_", " ")}</th>)}</tr></thead>
              <tbody>
                {movies.map((movie, rowIndex) => (
                  <tr key={movie.id ?? rowIndex}>
                    {columns.map((column) => <td key={column}>{cellValue(movie[column])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
