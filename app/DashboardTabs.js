import AppNavigation from "./AppNavigation";
import MemeVoteControls from "./MemeVoteControls";

export default function DashboardTabs({ user, generations, votes, currentPage, totalPages, generationsError }) {
  const votesByGeneration = new Map(votes.map((vote) => [vote.generation_id, vote.vote]));

  return (
    <>
      <AppNavigation user={user} />
      <section className="meme-feed" aria-labelledby="meme-feed-title">
        <h1 id="meme-feed-title">AI Humor App</h1>
        {generationsError ? <p className="status error" role="alert">Couldn’t load memes: {generationsError}</p> : generations.length === 0 ? <p className="status">No memes have been uploaded yet.</p> : (
          <div className="meme-grid">
            {generations.map((generation) => (
              <article className="meme-card" key={generation.id}>
                <img src={generation.image_url} alt="AI-generated meme" />
                <div className="meme-card-content">
                  <p className="meme-caption">{generation.content_text}</p>
                  <MemeVoteControls
                    generationId={generation.id}
                    upvotes={generation.upvotes}
                    downvotes={generation.downvotes}
                    currentVote={votesByGeneration.get(generation.id) ?? null}
                  />
                </div>
              </article>
            ))}
          </div>
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
