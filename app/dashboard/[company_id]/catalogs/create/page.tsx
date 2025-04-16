import { CatalogForm } from "@/components/catalog/forms/catalog"
import { Metadata } from "next"

export default async function CreateCatalogPage({ params }: { params: { company_id: string } }) {
  const companyId = parseInt(params.company_id, 10)
  if (isNaN(companyId)) {
    return <div>Invalid company ID</div> // Or redirect/notFound()
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Create New Catalog</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <CatalogForm companyId={companyId} />
      </div>
    </main>
  )
}
