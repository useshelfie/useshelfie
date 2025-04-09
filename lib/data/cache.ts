import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

interface DashboardStats {
  productsCount: number
  categoriesCount: number
}

export async function getCategoriesByCompanyID() {
  try {
    // get company id from the url header
    const headerList = await headers()
    const pathname = headerList.get("x-current-path")
    const currentCompanyID = pathname?.split("/")[2] // assume pathname is /dashboard/[company_id]

    // create client
    const supabase = await createClient()

    // fetch all categories that belong to the current company
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .eq("company_id", currentCompanyID)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return categories || []
  } catch (err) {
    console.error("Cache execution error:", err)
    return []
  }
}

export async function getProductsByCompanyId() {
  try {
    // get company id from the url header
    const headerList = await headers()
    const pathname = headerList.get("x-current-path")
    const currentCompanyID = pathname?.split("/")[2] // assume pathname is /dashboard/[company_id]

    // create client
    const supabase = await createClient()

    // fetch all products with their respective categories that belong to the current company
    const { data: products, error } = await supabase
      .from("products")
      .select("*, categories(*)")
      .eq("company_id", currentCompanyID)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    return products || []
  } catch (err) {
    console.error("Execution error:", err)
    return []
  }
}

export async function fetchDashboardStatsByCompanyId(): Promise<DashboardStats> {
  try {
    const supabase = await createClient()
    // Fetch the current url from x-current-path header
    const headerList = await headers()
    const pathname = headerList.get("x-current-path")
    const currentCompanyID = pathname?.split("/")[2] // assume pathname is /dashboard/[company_id]
    if (!currentCompanyID) {
      console.error("No company ID found in the URL")
      return { productsCount: -1, categoriesCount: -1 }
    }
    const [{ count: productsCount }, { count: categoriesCount }] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("company_id", currentCompanyID),
      supabase.from("categories").select("*", { count: "exact", head: true }).eq("company_id", currentCompanyID),
    ])
    return {
      productsCount: productsCount || 0,
      categoriesCount: categoriesCount || 0,
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return { productsCount: 0, categoriesCount: 0 }
  }
}
