import { createClient } from "@/lib/supabase/server"

export async function getUserCompanies(userId: string) {
    const supabase = await createClient()
    const { data: companies, error } = await supabase.from("companies").select("id").eq("owner_id", userId)

    if (error) {
        console.error("Error fetching companies:", error)
        // Consider throwing an error or returning a specific error object
        return { data: null, error }
    }

    return { data: companies, error: null }
}

// Fetches details needed for company selection/display
export async function getUserCompanyDetails(userId: string) {
    if (!userId) {
        console.error("No user ID provided to getUserCompanyDetails")
        return { data: null, error: new Error("User ID is required") }
    }

    const supabase = await createClient()
    const { data: companies, error } = await supabase
        .from("companies")
        .select("id, name") // Select only needed columns (id, name)
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error(`Error fetching company details for user ${userId}:`, error)
        return { data: null, error }
    }

    return { data: companies || [], error: null }
} 