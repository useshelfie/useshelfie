// lib/data/products.ts
import { createClient } from "@/lib/supabase/server"

export type ProductWithDetails = {
  id: string
  name: string
  description: string | null
  price: number
  created_at: string
  profiles: {
    // Assuming 'profiles' matches your table name
    username: string
  } | null
  categories: {
    id: string
    name: string
  }[]
}

/**
 * Fetches a seller's profile and their products by username.
 * @param id - The username of the seller.
 * @returns An object containing the seller's profile and their products.
 * @throws Error if the profile cannot be found or a database error occurs.
 */
export async function getSellerProfileAndProducts(id: string): Promise<{
  profile: { id: string; username: string } | null
  products: ProductWithDetails[]
}> {
  const supabase = await createClient()

  // Fetch profile to get user_id
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", id)
    .single()

  if (profileError || !profileData) {
    console.log(`Profile lookup failed for ${id}:`, profileError)
    console.log(profileData)
    throw new Error(`Profile lookup failed for ${id}: ${profileError?.message || "Unknown error"}`)
  }

  // Fetch products with related profile and categories
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
    .eq("user_id", profileData.id)
    .order("created_at", { ascending: false })

  if (productsError) {
    console.error(`Error fetching products for ${id}:`, productsError)
    return { profile: profileData, products: [] }
  }

  // Map the products data and add the profile info we already have
  const products = (productsData || []).map((product) => ({
    ...product,
    profiles: {
      username: profileData.username,
    },
  })) as ProductWithDetails[]

  return { profile: profileData, products }
}

/**
 * Fetches categories for the currently authenticated user.
 * @returns An array of the user's categories.
 * @throws Error if the user is not authenticated or a database error occurs.
 */
export async function getCategoriesForCurrentUser(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase.from("categories").select("id, name").eq("user_id", user.id).order("name")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data || []
}
