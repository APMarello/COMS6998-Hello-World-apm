"use client";

import { useMemo, useState } from "react";

function findColumn(columns, name) {
  return columns.find((column) => column.toLowerCase() === name)
    ?? columns.find((column) => column.toLowerCase().includes(name));
}

function text(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function genreValues(value) {
  if (Array.isArray(value)) return value.flatMap(genreValues);
  return text(value).split(/[,|/;]/).map((genre) => genre.trim()).filter(Boolean);
}

export default function MovieTable({ movies, columns }) {
  const [yearFilter, setYearFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [sort, setSort] = useState("ranking");

  const yearColumn = findColumn(columns, "year");
  const genreColumn = findColumn(columns, "genre");
  const directorColumn = findColumn(columns, "director");
  const rankColumn = findColumn(columns, "rank") ?? findColumn(columns, "ranking");
  const titleColumn = findColumn(columns, "title") ?? findColumn(columns, "name") ?? columns[0];
  const years = useMemo(() => [...new Set(movies.map((movie) => movie[yearColumn]).filter((year) => year !== null && year !== undefined).map(String))]
    .sort((left, right) => Number(left) - Number(right)), [movies, yearColumn]);
  const genres = useMemo(() => [...new Set(movies.flatMap((movie) => genreValues(movie[genreColumn])))]
    .sort((left, right) => left.localeCompare(right)), [movies, genreColumn]);

  const filteredMovies = useMemo(() => movies
    .map((movie, index) => ({ movie, index, rank: Number(movie[rankColumn]) || index + 1 }))
    .filter(({ movie }) => {
      const matchesYear = !yearFilter || String(movie[yearColumn]) === yearFilter;
      const matchesGenre = !genreFilter || genreValues(movie[genreColumn])
        .some((genre) => genre.toLowerCase() === genreFilter.toLowerCase());
      return matchesYear && matchesGenre;
    })
    .sort((left, right) => {
      if (sort === "newest") return Number(right.movie[yearColumn]) - Number(left.movie[yearColumn]) || left.rank - right.rank;
      if (sort === "oldest") return Number(left.movie[yearColumn]) - Number(right.movie[yearColumn]) || left.rank - right.rank;
      if (sort === "title") return text(left.movie[titleColumn]).localeCompare(text(right.movie[titleColumn]), undefined, { sensitivity: "base" });
      return left.rank - right.rank;
    }), [movies, rankColumn, yearColumn, genreColumn, yearFilter, genreFilter, sort, titleColumn]);

  return (
    <section className="movie-results" aria-label="Ranked movies">
      <div className="filters" role="group" aria-label="Filter and sort movies">
        <p className="result-count"><strong>{filteredMovies.length}</strong> {filteredMovies.length === 1 ? "film" : "films"}</p>
        {yearColumn && (
          <label className="filter-control">
            <span>Year</span>
            <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
              <option value="">All years</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        )}
        {genreColumn && (
          <label className="filter-control">
            <span>Genre</span>
            <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
              <option value="">All genres</option>
              {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
            </select>
          </label>
        )}
        <label className="filter-control sort-control">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="ranking">Ranking</option>
            {yearColumn && <><option value="newest">Year: Newest</option><option value="oldest">Year: Oldest</option></>}
            <option value="title">Title A–Z</option>
          </select>
        </label>
        {(yearFilter || genreFilter) && <button className="clear-filters" type="button" onClick={() => { setYearFilter(""); setGenreFilter(""); }}>Clear filters</button>}
      </div>

      {filteredMovies.length === 0 ? (
        <p className="empty-card-results" role="status">No films match the selected filters.</p>
      ) : (
        <ol className="movie-list">
          {filteredMovies.map(({ movie, index, rank }) => {
            const metadata = [
              directorColumn && text(movie[directorColumn]),
              yearColumn && text(movie[yearColumn]),
              genreColumn && text(movie[genreColumn]),
            ].filter(Boolean);

            return (
              <li className="movie-row" key={movie.id ?? index}>
                <span className="movie-rank" aria-label={`Rank ${rank}`}>{String(rank).padStart(2, "0")}</span>
                <div className="movie-details">
                  <h2>{text(movie[titleColumn]) || "Untitled film"}</h2>
                  {metadata.length > 0 && <p>{metadata.join(" · ")}</p>}
                </div>
                <span className="movie-arrow" aria-hidden="true">→</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
