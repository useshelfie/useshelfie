import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCompanies } from "@/lib/data/companies"

// TODO: i think this is stupid way to redirect to the first company or create a new one from landing page.
export default async function DashboardInitialPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Handle case where user is not logged in, maybe redirect to login
    redirect("/auth/login")
  }

  // Use the new function to fetch companies
  const { data: companies, error: companiesError } = await getUserCompanies(user.id)

  if (companiesError || !companies) {
    console.error("Error loading companies:", companiesError)
    // TODO: Show a user-friendly error page instead of just text
    return <div>Error loading companies. Please try again later.</div>
  }

  if (companies.length === 0) {
    // If no companies are found, redirect to the company creation page
    redirect("/dashboard/company/create")
  } else {
    // Redirect to the first company's dashboard
    redirect(`/dashboard/${companies[0].id}`)
  }

  // This part is effectively unreachable but kept for clarity
  return <></>
}
