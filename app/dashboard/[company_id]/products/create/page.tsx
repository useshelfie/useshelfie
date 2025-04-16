import { headers } from "next/headers"
import { ProductForm } from "@/components/product/forms/product"
import { getCategoriesByCompany } from "@/lib/data/categories"
import { Metadata } from "next"

// Define the expected Category type for the form
type FormCategory = { id: string; name: string }

export const metadata: Metadata = {
  title: "Create Product",
  description: "Create Product",
}

export default async function DashboardCreateProductPage() {
  const headerList = await headers()
  const currentCompanyID = headerList.get("x-current-path")?.split("/")[2]

  if (!currentCompanyID) {
    // Consider throwing an error or redirecting if company ID is essential
    console.error("Company ID not found in headers")
    return <div>Error: Company context not found.</div>
  }

  // Fetch categories for the current user server-side
  // Assuming getCategoriesByCompany returns { id: number; name: string; ... }[]
  const userCategoriesFromDb = await getCategoriesByCompany(currentCompanyID)

  // Map categories to the format expected by the form (string IDs)
  const initialFormCategories: FormCategory[] = userCategoriesFromDb.map((cat) => ({
    id: String(cat.id), // Explicitly convert ID to string
    name: cat.name,
  }))

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-start gap-8 p-4 md:p-8">
      {/* Pass the correctly formatted categories */}
      <ProductForm initialCategories={initialFormCategories} companyId={currentCompanyID} />
    </div>
  )
}
