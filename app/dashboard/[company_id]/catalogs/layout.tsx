"use client" // Make this a client component

import React, { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getCatalogsByCompany } from "@/lib/data/catalogs"
import { useQuery } from "@tanstack/react-query"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import { CatalogSidebarNav } from "@/components/sidebars/catalog"

// Import Shadcn components
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Import icons
import { PlusCircle, Menu } from "lucide-react"

// --- CatalogLayout Component ---
export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const companyIdStr = Array.isArray(params.company_id) ? params.company_id[0] : params.company_id
  const companyId = parseInt(companyIdStr || "0", 10)

  // Check if we're on mobile
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // State to control mobile sidebar
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false)

  const supabase = createClient()

  // Fetch catalogs using useQuery
  const {
    data: catalogsData,
    isLoading: isLoadingCatalogs,
    isError: isErrorCatalogs,
    error: errorCatalogs,
  } = useQuery({
    queryKey: ["catalogs", companyId],
    queryFn: async () => {
      if (!companyId) return []
      const data = await getCatalogsByCompany(supabase, companyId)
      return data
    },
    enabled: !!companyId && companyId > 0,
    staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
  })

  // Log error if exists
  useEffect(() => {
    if (errorCatalogs) {
      console.error("Failed to fetch catalogs:", errorCatalogs)
    }
  }, [errorCatalogs])

  if (isNaN(companyId) || companyId <= 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold text-destructive">Invalid Company ID</h1>
          <p className="text-muted-foreground mt-2">Please check the URL and try again.</p>
        </div>
      </div>
    )
  }

  // Desktop layout
  if (isDesktop) {
    return (
      <div className="h-full p-4 flex w-full">
        <div className="w-90 border-r pr-4">
          <CatalogSidebarNav
            companyId={companyId}
            catalogs={catalogsData}
            isLoading={isLoadingCatalogs}
            isError={isErrorCatalogs}
          />
        </div>
        <main className="h-full overflow-y-auto w-full">{children}</main>
      </div>
    )
  }

  // Mobile layout with Sheet for sidebar
  return (
    <div className="flex flex-col h-screen">
      {/* Mobile header with menu button */}
      <header className="flex items-center justify-between border-b p-3 h-14">
        <div className="flex items-center">
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 pt-10">
              <div className="p-4">
                <CatalogSidebarNav
                  companyId={companyId}
                  catalogs={catalogsData}
                  isLoading={isLoadingCatalogs}
                  isError={isErrorCatalogs}
                  isMobile={true}
                  onCatalogSelect={() => setIsMobileNavOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold">Catalogs</h1>
        </div>
        <Link href={`/dashboard/${companyId}/catalogs/create`}>
          <Button size="sm" variant="outline" className="h-8">
            <PlusCircle className="h-4 w-4 mr-2" />
            New
          </Button>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
