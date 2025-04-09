export default async function ProductsPage({
  params,
}: {
  params: Promise<{ product_id: string; company_id: string }>
}) {
  const { product_id, company_id } = await params

  return (
    <div className="container mx-auto px-4 py-8">
      {product_id} <br />
      {company_id}
    </div>
  )
}
