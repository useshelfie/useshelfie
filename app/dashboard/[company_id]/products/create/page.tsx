// app/dashboard/products/create/page.tsx
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/forms/product"
import { getCategoriesForCurrentCompany } from "@/lib/data/products" // Import function to get categories

export default async function DashboardCreateProductPage() {
  const supabase = await createClient()
  const headerList = await headers()
  const currentCompanyID = headerList.get("x-current-path")?.split("/")[2] // assume pathname is /dashboard/[company_id]

  if (!currentCompanyID) {
    return <div></div>
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  // Fetch categories for the current user server-side
  const userCategories = await getCategoriesForCurrentCompany(currentCompanyID)

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-start gap-8 p-4 md:p-8">
      <ProductForm initialCategories={userCategories} />
    </div>
  )
}
