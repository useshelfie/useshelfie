import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditProductForm } from "./_components/edit-product-form"
import { DeleteProductButton } from "./_components/delete-product-button"

// Define Category type locally if not available globally
interface Category {
  id: number
  name: string
}

export default async function ProductEditPage({ 
    params 
}: { 
    params: { product_id: string; company_id: string } 
}) {
  const supabase = await createClient()
  const { product_id, company_id } = params

  // Fetch product with its currently linked categories
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(
      `
      *,
      product_categories (
        category_id
      )
    `
    )
    .eq("id", product_id)
    // Ensure the product belongs to the company in the URL
    .eq("company_id", parseInt(company_id, 10)) 
    .single()

  if (productError || !product) {
    console.error("Error fetching product:", productError)
    notFound()
  }

  // Fetch all categories available for this company
  const { data: availableCategories, error: categoriesError } = await supabase
     .from('categories')
     .select('id, name')
     .eq('company_id', product.company_id)
     .order('name');

  if (categoriesError) {
     console.error("Error fetching available categories:", categoriesError);
     // Handle error appropriately - maybe show message or default to empty list?
     // For now, proceed with potentially empty list
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link href={`/dashboard/${company_id}/products`}>
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        {/* Edit Form */}
        <EditProductForm 
            product={product} 
            availableCategories={availableCategories || []} 
            companyId={product.company_id} 
        />

        {/* Delete Button (with spacing) */}
        <div className="mt-8 pt-8 border-t border-destructive/20">
             <DeleteProductButton 
                productId={product.id} 
                productName={product.name} 
                companyId={product.company_id}
             />
        </div>
      </div>
    </div>
  )
}
