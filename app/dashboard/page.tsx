import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// TODO: i think this is stupid way to redirect to the first company or create a new one from landing page.
export default async function DashboardInitialPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user?.id)

  if (companiesError || !companies) {
    console.error("Error fetching companies:", companiesError)
    return <div>Error loading companies</div>
  }

  if (companies.length === 0) {
    // If no companies are found, redirect to the company creation page
    redirect("/dashboard/company/create")
  } else {
    redirect(`/dashboard/${companies[0].id}`)
  }

  return <></> // This line is never reached due to the redirect
}
