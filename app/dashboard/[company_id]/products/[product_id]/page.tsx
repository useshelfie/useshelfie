export default async function ProductsPage({
  params,
}: {
  params: Promise<{ product_id: string; company_id: string }>
}) {
  const { product_id, company_id } = await params

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
      </div>
      {product_id} <br />
      {company_id}
    </div>
  )
}
