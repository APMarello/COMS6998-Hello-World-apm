"use client";

import { useEffect, useMemo, useState } from "react";

function cellValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function compareValues(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && String(left).trim() && String(right).trim()) {
    return leftNumber - rightNumber;
  }

  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
}

function findColumn(columns, name) {
  return columns.find((column) => column.toLowerCase() === name)
    ?? columns.find((column) => column.toLowerCase().includes(name));
}

function genreValues(value) {
  if (Array.isArray(value)) return value.flatMap(genreValues);
  if (value === null || value === undefined) return [];
  return String(value).split(/[,|/;]/).map((genre) => genre.trim()).filter(Boolean);
}

export default function MovieTable({ movies, columns }) {
  const [sort, setSort] = useState({ column: null, direction: "asc" });
  const [view, setView] = useState("table");
  const [theme, setTheme] = useState("light");
  const [themeReady, setThemeReady] = useState(false);
  const [yearFilter, setYearFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");

  const yearColumn = findColumn(columns, "year");
  const genreColumn = findColumn(columns, "genre");
  const titleColumn = findColumn(columns, "title") ?? findColumn(columns, "name") ?? columns[0];
  const years = useMemo(() => [...new Set(movies.map((movie) => movie[yearColumn]).filter((year) => year !== null && year !== undefined).map(String))]
    .sort((left, right) => Number(left) - Number(right)), [movies, yearColumn]);
  const genres = useMemo(() => [...new Set(movies.flatMap((movie) => genreValues(movie[genreColumn])))]
    .sort((left, right) => left.localeCompare(right)), [movies, genreColumn]);

  const filteredMovies = useMemo(() => movies.filter((movie) => {
    const matchesYear = !yearFilter || String(movie[yearColumn]) === yearFilter;
    const matchesGenre = !genreFilter || genreValues(movie[genreColumn])
      .some((genre) => genre.toLowerCase() === genreFilter.toLowerCase());
    return matchesYear && matchesGenre;
  }), [movies, yearColumn, genreColumn, yearFilter, genreFilter]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("movie-theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(savedTheme === "dark" || savedTheme === "light" ? savedTheme : preferredTheme);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("movie-theme", theme);
  }, [theme, themeReady]);

  const sortedMovies = useMemo(() => {
    if (!sort.column) return filteredMovies;

    return filteredMovies
      .map((movie, index) => ({ movie, index }))
      .sort((left, right) => {
        const leftValue = left.movie[sort.column];
        const rightValue = right.movie[sort.column];
        const leftMissing = leftValue === null || leftValue === undefined;
        const rightMissing = rightValue === null || rightValue === undefined;
        if (leftMissing || rightMissing) {
          if (leftMissing === rightMissing) return left.index - right.index;
          return leftMissing ? 1 : -1;
        }

        const result = compareValues(leftValue, rightValue);
        return result === 0 ? left.index - right.index : result * (sort.direction === "asc" ? 1 : -1);
      })
      .map(({ movie }) => movie);
  }, [filteredMovies, sort]);

  function toggleSort(column) {
    setSort((current) => ({
      column,
      direction: current.column === column && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  return (
    <>
      {(yearColumn || genreColumn) && (
        <div className="filters" role="group" aria-label="Filter movies">
          {yearColumn && (
            <label>
              <span>Year</span>
              <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                <option value="">All years</option>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          )}
          {genreColumn && (
            <label>
              <span>Genre</span>
              <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
                <option value="">All genres</option>
                {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
              </select>
            </label>
          )}
          {(yearFilter || genreFilter) && <button className="clear-filters" type="button" onClick={() => { setYearFilter(""); setGenreFilter(""); }}>Clear filters</button>}
        </div>
      )}
      <div className="toolbar">
        <div className="view-controls" role="group" aria-label="Choose result view">
          <button type="button" className={view === "table" ? "active" : ""} aria-pressed={view === "table"} onClick={() => setView("table")}>Table view</button>
          <button type="button" className={view === "cards" ? "active" : ""} aria-pressed={view === "cards"} onClick={() => setView("cards")}>Card view</button>
        </div>
        <button className="theme-toggle" type="button" aria-pressed={theme === "dark"} onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </div>
      {view === "table" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => {
                  const isSorted = sort.column === column;
                  const direction = isSorted ? sort.direction : null;

                  return (
                    <th key={column} scope="col" aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}>
                      <button className="sort-button" type="button" onClick={() => toggleSort(column)}>
                        {column.replaceAll("_", " ")}
                        <span className="sort-indicator" aria-hidden="true">{direction === "asc" ? "↑" : direction === "desc" ? "↓" : "↕"}</span>
                        <span className="sr-only">{direction ? `, sorted ${direction === "asc" ? "ascending" : "descending"}` : ", sort"}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedMovies.map((movie, rowIndex) => (
                <tr key={movie.id ?? rowIndex}>
                  {columns.map((column) => <td key={column}>{cellValue(movie[column])}</td>)}
                </tr>
              ))}
              {sortedMovies.length === 0 && (
                <tr><td className="empty-results" colSpan={columns.length}>No films match the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : sortedMovies.length === 0 ? (
        <p className="empty-card-results">No films match the selected filters.</p>
      ) : (
        <div className="movie-cards">
          {sortedMovies.map((movie, rowIndex) => (
            <article className="movie-card" key={movie.id ?? rowIndex}>
              <h2>{cellValue(movie[titleColumn])}</h2>
              <dl>
                {columns.filter((column) => column !== titleColumn).map((column) => (
                  <div key={column}>
                    <dt>{column.replaceAll("_", " ")}</dt>
                    <dd>{cellValue(movie[column])}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
