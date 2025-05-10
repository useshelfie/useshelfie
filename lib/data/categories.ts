import { createClient } from "@/lib/supabase/server"

// Renamed for clarity and added companyId parameter
export async function getCategoriesByCompany(companyId: string) {
  if (!companyId) {
    console.error("No company ID provided to getCategoriesByCompany")
    return []
  }

  try {
    // create client
    const supabase = await createClient()

    // fetch all categories that belong to the current company
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(`Error fetching categories for company ${companyId}:`, error)
      return [] // Consider throwing or returning error
    }

    return categories || []
  } catch (err) {
    console.error(`Execution error in getCategoriesByCompany for company ${companyId}:`, err)
    return [] // Consider throwing or returning error
  }
}

/**
 * Fetches categories for the currently choosen company.
 * @returns An array of the company's categories.
 * @throws Error if database error occurs.
 */
export async function getCategoriesForCurrentCompany(companyId: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("categories").select("id, name").eq("company_id", companyId).order("name")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data || []
}
