// lib/data/products.ts
import { createClient } from "@/lib/supabase/server"

export type ProductWithDetails = {
  id: string
  name: string
  description: string | null
  price: number
  created_at: string
  companies: {
    name: string
  } | null
  categories: {
    id: string
    name: string
  }[]
}

/**
 * Fetches a company and their products by company id.
 * @param company_id - The id of a company
 * @returns An object containing the company's profile and their products.
 * @throws Error if the company cannot be found or a database error occurs.
 */
export async function getCompanyAndProducts(companyId: string): Promise<{
  company: { id: string; owner_id: string; name: string } | null
  products: ProductWithDetails[]
}> {
  const supabase = await createClient()

  // Fetch company
  const { data: companyData, error: companyDataError } = await supabase
    .from("companies")
    .select("id, owner_id, name")
    .eq("id", companyId)
    .single()

  // Check for errors
  if (companyDataError || !companyData) {
    console.log(`Company lookup failed for ${companyId}:`, companyDataError)
    console.log(companyData)
    throw new Error(`Company lookup failed for ${companyId}: ${companyDataError?.message || "Unknown error"}`)
  }

  // Fetch products with related companies and categories
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select(
      `
			id,
			name,
			description,
			price,
			created_at,
			categories ( id, name )
		`
    )
    .eq("company_id", companyData.id)
    .order("created_at", { ascending: false })

  if (productsError) {
    console.error(`Error fetching products for ${companyData.id}:`, productsError)
    return { company: companyData, products: [] }
  }

  // Map the products data and add the profile info we already have
  const products = (productsData || []).map((product) => ({
    ...product,
    companies: {
      name: companyData.name,
    },
  })) as ProductWithDetails[]

  return { company: companyData, products }
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
