import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function getCachedCategories() {
	try {
		const supabase = await createClient()
		return await unstable_cache(
			async () => {
				try {
					const { data: categories, error } = await supabase
						.from("categories")
						.select("*")
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
			},
			["all-categories"],
			{
				revalidate: 10,
				tags: ["categories"],
			}
		)()
	} catch (err) {
		console.error("Cache wrapper error:", err)
		return []
	}
}

export async function getCachedProducts() {
	try {
		const supabase = await createClient()
		return await unstable_cache(
			async () => {
				try {
					const { data: products, error } = await supabase
						.from("products")
						.select("*, categories(*)")
						.order("created_at", { ascending: false })

					if (error) {
						console.error("Error fetching products:", error)
						return []
					}

					return products || []
				} catch (err) {
					console.error("Cache execution error:", err)
					return []
				}
			},
			["all-products"],
			{
				revalidate: 10,
				tags: ["products"],
			}
		)()
	} catch (err) {
		console.error("Cache wrapper error:", err)
		return []
	}
}
