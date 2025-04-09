import { notFound } from "next/navigation"
import { getSellerProfileAndProducts } from "@/lib/data/products"
import ProductCard from "@/components/product-card"
import { PageProps } from "@/.next/types/app/layout"

export default async function SellerProfilePage({ params }: PageProps) {
  const { user_id } = await params
  const { profile, products } = await getSellerProfileAndProducts(user_id)

  if (!profile) {
    notFound() // Trigger 404 if seller username doesn't exist
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">
        Products by <span className="text-primary">{profile.username}</span>
      </h1>

      {products.length === 0 ? (
        <p className="text-muted-foreground">This seller has not listed any products yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard sellerId={user_id} product={product} key={product.id} />
          ))}
        </div>
      )}
    </div>
  )
}

// Optional: Generate static paths if you have a known list of sellers
// export async function generateStaticParams() { ... }
