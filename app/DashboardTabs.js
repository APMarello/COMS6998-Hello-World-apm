import AppNavigation from "./AppNavigation";
import MemeFeed from "./MemeFeed";

export default function DashboardTabs({ user, generations, votes, currentPage, totalPages, generationsError }) {
  return (
    <>
      <AppNavigation user={user} />
      <section className="meme-feed" aria-labelledby="meme-feed-title">
        <h1 id="meme-feed-title">AI Humor App</h1>
        <p className="meme-feed-instructions">Browse the latest posts and cast your vote with an upvote or downvote.</p>
        {generationsError ? <p className="status error" role="alert">Couldn’t load memes: {generationsError}</p> : generations.length === 0 ? <p className="status">No memes have been uploaded yet.</p> : (
          <MemeFeed generations={generations} votes={votes} />
        )}
        {totalPages > 1 && (
          <nav className="meme-pagination" aria-label="Meme pages">
            {currentPage > 1 ? <a href={currentPage === 2 ? "/home" : `/home?page=${currentPage - 1}`}>← Previous</a> : <span>← Previous</span>}
            <span>Page {currentPage} of {totalPages}</span>
            {currentPage < totalPages ? <a href={`/home?page=${currentPage + 1}`}>Next →</a> : <span>Next →</span>}
          </nav>
        )}
      </section>
    </>
  );
}
