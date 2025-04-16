import React from "react"
import { createClient } from "@/lib/supabase/server"
import { getCatalogBySlug } from "@/lib/data/catalogs"
import { EditCatalogForm } from "@/components/catalog/forms/edit-catalog-form"
import { notFound } from "next/navigation"

export default async function EditCatalogPage({ params }: { params: { company_id: string; catalog_slug: string } }) {
  const companyId = parseInt(params.company_id, 10)
  if (isNaN(companyId)) {
    return <div>Invalid company ID</div> // Or redirect/notFound()
  }

  const supabase = await createClient()
  const catalog = await getCatalogBySlug(supabase, companyId, params.catalog_slug)

  if (!catalog) {
    notFound()
  }

  return (
    <div className="flex justify-center pt-8">
      <EditCatalogForm companyId={companyId} catalog={catalog} />
    </div>
  )
}
