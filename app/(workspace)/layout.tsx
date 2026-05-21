import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
