"use client";

import { useEffect } from "react";

export default function MovieDetailsDrawer({ details, onClose }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="movie-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="movie-drawer" role="dialog" aria-modal="true" aria-labelledby="movie-details-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="close-drawer" type="button" aria-label="Close film details" onClick={onClose}>×</button>
        <p className="eyebrow">Film details</p>
        <h2 id="movie-details-title">{details.title}</h2>
        <div className="movie-detail-content">
          <p className="movie-detail-meta">{[details.year, details.genre].filter(Boolean).join(" · ")}</p>
          <dl className="film-facts">
            <div><dt>Rotten Tomatoes</dt><dd>{details.rottenTomatoes || "Not available"}</dd></div>
            <div><dt>Director</dt><dd>{details.director || "Not available"}</dd></div>
          </dl>
          <div className="movie-detail-copy">
            <h3>Synopsis</h3>
            <p>{details.synopsis || "No synopsis is included in this collection."}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
