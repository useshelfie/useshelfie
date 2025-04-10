import { SidebarTrigger } from "./ui/sidebar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CompanyChooser from "./company-chooser"

export default async function DashboardNavigationBar() {
  // Create supabase client
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Check for errors
  if (authError || !user) {
    console.error("Authentication error:", authError)
    redirect("/auth/login")
  }

  // Get user ID
  const userId = user.id

  // Get user companies
  const { data: companies, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })

  // Check for errors
  if (companyError) {
    console.error("Company retrieval error:", companyError)
    redirect("/auth/login")
  }

  // Check if user has companies
  // That is theoritically not possible, but sitll checking
  if (!companies || companies.length === 0) {
    console.error("No companies found for user:", userId)
    redirect("/dashboard/company/create")
  }

  return (
    <nav className="bg-sidebar border-sidebar h-16 flex items-center justify-between px-4 shadow-sm">
      <div className="text-lg font-bold">
        <SidebarTrigger className="text-black" />
      </div>

      {/* Company chooser */}
      <CompanyChooser companies={companies} />
    </nav>
  )
}
