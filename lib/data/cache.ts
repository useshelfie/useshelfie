import { createClient } from "@/lib/supabase/server"
// import { headers } from "next/headers" // No longer needed here

interface DashboardStats {
  productsCount: number
  categoriesCount: number
}

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

// Renamed for clarity and added companyId parameter
export async function getProductsByCompany(companyId: string) {
  if (!companyId) {
    console.error("No company ID provided to getProductsByCompany")
    return []
  }

  try {
    // create client
    const supabase = await createClient()

    // fetch all products with their respective categories that belong to the current company
    const { data: products, error } = await supabase
      .from("products")
      .select("*, categories(*)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(`Error fetching products for company ${companyId}:`, error)
      return [] // Consider throwing or returning error
    }

    return products || []
  } catch (err) {
    console.error(`Execution error in getProductsByCompany for company ${companyId}:`, err)
    return [] // Consider throwing or returning error
  }
}

// Renamed for clarity and added companyId parameter
export async function fetchDashboardStatsByCompany(companyId: string): Promise<DashboardStats> {
  if (!companyId) {
    console.error("No company ID provided to fetchDashboardStatsByCompany")
    // Return a default/error state or throw
    return { productsCount: 0, categoriesCount: 0 }
  }

  try {
    const supabase = await createClient()

    // Use Promise.all to fetch counts concurrently
    const [productsResult, categoriesResult] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("categories").select("*", { count: "exact", head: true }).eq("company_id", companyId),
    ])

    // Handle potential errors from individual queries
    if (productsResult.error) {
      console.error(`Error fetching product count for company ${companyId}:`, productsResult.error)
    }
    if (categoriesResult.error) {
      console.error(`Error fetching category count for company ${companyId}:`, categoriesResult.error)
    }

    return {
      productsCount: productsResult.count || 0,
      categoriesCount: categoriesResult.count || 0,
    }
  } catch (error) {
    console.error(`Failed to fetch dashboard stats for company ${companyId}:`, error)
    // Return a default/error state or throw
    return { productsCount: 0, categoriesCount: 0 }
  }
}

