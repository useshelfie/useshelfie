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
