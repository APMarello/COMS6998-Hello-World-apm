import UploadMemeForm from "../UploadMemeForm";
import AppNavigation from "../AppNavigation";
import { createClient } from "../../utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main>
      <section className="movies" aria-label="AI Humor App upload">
        <AppNavigation user={{ id: user.id, email: user.email, user_metadata: user.user_metadata ?? {} }} showUpload={false} />
        <div className="upload-page" aria-labelledby="upload-title">
          <div className="upload-header">
            <h1 id="upload-title">Upload a meme</h1>
          </div>
          <UploadMemeForm userId={user.id} />
        </div>
      </section>
    </main>
  );
}
