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
    // Throw an error for invalid input
    throw new Error("No company ID provided to fetchDashboardStatsByCompany");
  }

  const supabase = await createClient(); // Assuming createClient handles its own errors or throws

  try {
    // Use Promise.allSettled to handle potential errors from individual queries gracefully
    const results = await Promise.allSettled([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("company_id", companyId),
      supabase.from("categories").select("*", { count: "exact", head: true }).eq("company_id", companyId),
    ]);

    const productsResult = results[0];
    const categoriesResult = results[1];

    // Check for errors after all promises have settled
    if (productsResult.status === 'rejected' || (productsResult.status === 'fulfilled' && productsResult.value.error)) {
      const error = productsResult.status === 'rejected' ? productsResult.reason : productsResult.value.error;
      console.error(`Error fetching product count for company ${companyId}:`, error);
      // Re-throw the specific error or a general error
      throw new Error(`Failed to fetch product count: ${error?.message || 'Unknown error'}`);
    }

    if (categoriesResult.status === 'rejected' || (categoriesResult.status === 'fulfilled' && categoriesResult.value.error)) {
      const error = categoriesResult.status === 'rejected' ? categoriesResult.reason : categoriesResult.value.error;
      console.error(`Error fetching category count for company ${companyId}:`, error);
      // Re-throw the specific error or a general error
      throw new Error(`Failed to fetch category count: ${error?.message || 'Unknown error'}`);
    }

    // If both settled successfully and have no Supabase errors
    const productsCount = productsResult.status === 'fulfilled' ? productsResult.value.count : 0;
    const categoriesCount = categoriesResult.status === 'fulfilled' ? categoriesResult.value.count : 0;


    return {
      productsCount: productsCount || 0,
      categoriesCount: categoriesCount || 0,
    };
  } catch (error) {
    // Catch errors from createClient or Promise.allSettled itself (less likely)
    // Also catches the re-thrown errors from above
    console.error(`Failed to fetch dashboard stats for company ${companyId}:`, error);
    // Re-throw the caught error to be handled by the caller
    throw error;
  }
}

