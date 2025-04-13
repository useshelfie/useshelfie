import { createClient } from "@/lib/supabase/server"
import { type CatalogDatabaseData } from "@/schemas/catalogSchema"
import { type ProductDatabaseData } from "@/schemas/productSchema"
import { type SupabaseClient } from "@supabase/supabase-js"
import { type ProductWithDetails } from "@/lib/data/products"

// Helper function to generate a slug from a string
const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/[^\w-]+/g, "") // Remove all non-word chars
        .replace(/--+/g, "-") // Replace multiple - with single -
        .replace(/^-+/, "") // Trim - from start of text
        .replace(/-+$/, "") // Trim - from end of text
}

export async function getCatalogsByCompany(supabase: SupabaseClient, companyId: number): Promise<CatalogDatabaseData[]> {
    const { data, error } = await supabase
        .from("catalogs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true })

    if (error) {
        console.error("Error fetching catalogs:", error)
        throw new Error("Could not fetch catalogs")
    }

    // Validate data with Zod schema (optional but recommended)
    // const validatedData = CatalogDatabaseSchema.array().parse(data);
    return data as CatalogDatabaseData[]
}

export async function getCatalogBySlug(
    supabase: SupabaseClient,
    companyId: number,
    slug: string
): Promise<CatalogDatabaseData | null> {
    const { data, error } = await supabase
        .from("catalogs")
        .select("*")
        .eq("company_id", companyId)
        .eq("slug", slug)
        .single()

    if (error) {
        if (error.code === "PGRST116") {
            // No catalog found
            return null
        }
        console.error("Error fetching catalog by slug:", error)
        throw new Error("Could not fetch catalog")
    }

    return data as CatalogDatabaseData | null
}

export async function createCatalog(
    supabase: SupabaseClient,
    companyId: number,
    userId: string,
    name: string
): Promise<CatalogDatabaseData> {
    const slug = generateSlug(name)
    const { data, error } = await supabase
        .from("catalogs")
        .insert([{ company_id: companyId, user_id: userId, name: name, slug: slug }])
        .select()
        .single()

    if (error) {
        console.error("Error creating catalog:", error)
        // TODO: Handle potential slug conflicts more gracefully (e.g., append a number)
        throw new Error("Could not create catalog")
    }

    return data as CatalogDatabaseData
}

export async function updateCatalog(
    supabase: SupabaseClient,
    catalogId: number,
    name: string
): Promise<CatalogDatabaseData> {
    const slug = generateSlug(name)
    const { data, error } = await supabase
        .from("catalogs")
        .update({ name: name, slug: slug, updated_at: new Date().toISOString() })
        .eq("id", catalogId)
        .select()
        .single()

    if (error) {
        console.error("Error updating catalog:", error)
        throw new Error("Could not update catalog")
    }

    return data as CatalogDatabaseData
}

export async function deleteCatalog(supabase: SupabaseClient, catalogId: number): Promise<void> {
    // Constraint: Products must belong to a catalog. Need to handle products in the catalog being deleted.
    // Option 1: Delete products (if allowed by business logic)
    // Option 2: Set product.catalog_id to null (if allowed by schema)
    // Option 3: Reassign products to a default catalog (requires a default catalog)
    // Option 4: Prevent deletion if catalog contains products (safest default)

    // Check if catalog has products first
    const { count, error: countError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("catalog_id", catalogId)

    if (countError) {
        console.error("Error checking products in catalog:", countError)
        throw new Error("Could not verify if catalog contains products.")
    }

    if (count !== null && count > 0) {
        throw new Error("Cannot delete catalog because it contains products. Please move or delete the products first.")
    }

    // Proceed with deletion if no products found
    const { error } = await supabase.from("catalogs").delete().eq("id", catalogId)

    if (error) {
        console.error("Error deleting catalog:", error)
        throw new Error("Could not delete catalog")
    }
}

export async function getProductsByCatalog(
    supabase: SupabaseClient,
    catalogId: number
): Promise<ProductDatabaseData[]> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("catalog_id", catalogId)
        .order("created_at", { ascending: true })

    if (error) {
        console.error("Error fetching products by catalog:", error)
        throw new Error("Could not fetch products for this catalog")
    }

    return (data || []) as ProductDatabaseData[]
}

export async function updateProductCatalog(
    supabase: SupabaseClient,
    productId: string,
    newCatalogId: number
): Promise<ProductDatabaseData> {
    const { data, error } = await supabase
        .from("products")
        .update({ catalog_id: newCatalogId })
        .eq("id", productId)
        .select()
        .single()

    if (error) {
        console.error("Error updating product catalog:", error)
        throw new Error("Could not update product catalog")
    }

    return data as ProductDatabaseData
}

// Fetch products for a company that are NOT in a specific catalog (i.e., catalog_id is null or different)
export async function getProductsByCompanyExcludingCatalog(
    supabase: SupabaseClient,
    companyId: number,
    excludeCatalogId: number
): Promise<ProductDatabaseData[]> {
    const { data, error } = await supabase
        .from("products")
        .select("*") // Select all product fields
        .eq("company_id", companyId)
        .or(`catalog_id.neq.${excludeCatalogId},catalog_id.is.null`) // Where catalog_id != excludeCatalogId OR catalog_id IS NULL
        .order("created_at", { ascending: true })

    if (error) {
        console.error("Error fetching products excluding catalog:", error)
        throw new Error("Could not fetch available products")
    }

    return data as ProductDatabaseData[]
}