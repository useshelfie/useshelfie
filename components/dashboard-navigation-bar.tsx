import { SidebarTrigger } from "./ui/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CompanyChooser from "./company-chooser"
import { getUserCompanyDetails } from "@/lib/data/companies"

export default async function DashboardNavigationBar() {
  // Create supabase client
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Check for errors or missing user
  if (authError || !user) {
    console.error("Authentication error:", authError)
    redirect("/auth/login")
  }

  // Use the new function to get company details
  const { data: companies, error: companyError } = await getUserCompanyDetails(user.id)

  // Check for errors during company fetch
  if (companyError) {
    console.error("Company retrieval error:", companyError)
    redirect("/dashboard")
  }

  // Check if user has companies (should ideally not happen if they reached the dashboard)
  if (!companies || companies.length === 0) {
    console.warn("No companies found for user in DashboardNavigationBar:", user.id)
    redirect("/dashboard/company/create")
  }

  return (
    <nav className="bg-sidebar border-sidebar py-2 flex items-center justify-between px-4 shadow-sm">
      <div className="text-lg font-bold">
        <SidebarTrigger className="text-black" />
      </div>

      {/* Company chooser */}
      <CompanyChooser companies={companies} />
    </nav>
  )
}
