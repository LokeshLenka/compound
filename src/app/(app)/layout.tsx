import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageTransitionWrapper } from "@/components/page-transition-wrapper"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return <AppShell profile={profile}><PageTransitionWrapper>{children}</PageTransitionWrapper></AppShell>
}