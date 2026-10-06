import DashboardTabs from "../DashboardTabs";
import { createClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const MEMES_PER_PAGE = 9;

export default async function HomePage({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const pageParam = Array.isArray(searchParams?.page) ? searchParams.page[0] : searchParams?.page;
  const requestedPage = Number.parseInt(pageParam, 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const from = (currentPage - 1) * MEMES_PER_PAGE;
  const to = from + MEMES_PER_PAGE - 1;

  const [
    { data: generations, error: generationsError, count: generationCount },
    { data: votes },
  ] = await Promise.all([
    supabase
      .from("ai_generations")
      .select("id, prompt_text, content_text, image_url, created_at, upvotes, downvotes", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to),
    supabase
      .from("meme_votes")
      .select("generation_id, vote")
      .eq("user_id", user.id),
  ]);
  const totalPages = Math.max(1, Math.ceil((generationCount ?? 0) / MEMES_PER_PAGE));

  if (generationCount && currentPage > totalPages) {
    redirect(totalPages === 1 ? "/home" : `/home?page=${totalPages}`);
  }

  return (
    <main>
      <section className="movies" aria-label="AI Humor App dashboard">
        <DashboardTabs
          user={{ id: user.id, email: user.email, user_metadata: user.user_metadata ?? {} }}
          generations={generations ?? []}
          votes={votes ?? []}
          currentPage={currentPage}
          totalPages={totalPages}
          generationsError={generationsError?.message ?? ""}
        />
      </section>
    </main>
  );
}
