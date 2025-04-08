// lib/data/products.ts
import { createClient } from '@/lib/supabase/server' // Use the server client

// Define type for product with categories and profile
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

export async function getProductsByUsername(
	username: string
): Promise<{
	profile: { username: string; id: string } | null
	products: ProductWithDetails[]
}> {
	// --- SOLUTION: Add await here ---
	const supabase = await createClient()

	// Fetch profile first to get user_id
	const { data: profileData, error: profileError } = await supabase
		.from('profiles')
		.select('id, username') // Selecting id as well, useful for the next query
		.eq('username', username)
		.single()

	if (profileError || !profileData) {
		console.error(`Profile lookup error for ${username}:`, profileError)
		// Ensure the return type matches the Promise signature if profile is null
		return { profile: null, products: [] } // Seller not found
	}

	// Fetch products associated with the profile's user_id, joining categories
	const { data: productsData, error: productsError } = await supabase
		.from('products')
		.select(
			`
            id,
            name,
            description,
            price,
            created_at,
            profiles!inner ( username ), /* Join profiles to ensure product belongs to the fetched profile */
            categories ( id, name ) /* Join categories via product_categories join table */
        `
		)
		.eq('user_id', profileData.id) // Use the fetched profileData.id
		.order('created_at', { ascending: false })

	if (productsError) {
		console.error(`Error fetching products for ${username}:`, productsError)
		// Return profile info but empty products on error
		// Ensure the return type matches the Promise signature
		return { profile: profileData, products: [] }
	}

	// Ensure the types match, handle potential nulls if necessary
	// Added explicit casting for safety, adjust if your Supabase types are more specific
	// @eslint-disable-next-line @typescript-eslint/no-explicit-any
	const products = ((productsData as any[]) || []) as ProductWithDetails[]

	// Ensure the return type matches the Promise signature
	return { profile: profileData, products }
}

// Function to fetch categories for the logged-in user (for the form)
export async function getUserCategories(): Promise<
	{ id: string; name: string }[]
> {
	// --- SOLUTION: Add await here ---
	const supabase = await createClient()

	// --- SOLUTION: Add await here ---
	// Also await the getUser() call as it's async too
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return []
	}

	const { data, error } = await supabase
		.from('categories')
		.select('id, name')
		.eq('user_id', user.id)
		.order('name')

	if (error) {
		console.error('Error fetching user categories:', error)
		return []
	}
	// Ensure return type matches Promise signature
	return data || []
}
