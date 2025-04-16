"use client" // Make this a client component

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type CatalogDatabaseData } from "@/schemas/catalogSchema"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Layers, PlusCircle } from "lucide-react"
import { CatalogSidebarItem } from "@/components/catalog-droppable-item"

// --- CatalogSidebarNav Component ---
interface CatalogSidebarNavProps {
  companyId: number
  catalogs: CatalogDatabaseData[] | undefined
  isLoading: boolean
  isError: boolean
  isMobile?: boolean
  onCatalogSelect?: () => void // For mobile to close drawer when selected
}

export function CatalogSidebarNav({
  companyId,
  catalogs,
  isLoading,
  isError,
  isMobile,
  onCatalogSelect,
}: CatalogSidebarNavProps) {
  const pathname = usePathname()

  // Determine if a catalog is active based on URL
  const isCatalogActive = (slug: string) => {
    return pathname?.includes(`/catalogs/${slug}`)
  }

  return (
    <nav className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Layers className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-lg font-semibold">Catalogs</h2>
        </div>
        <Link href={`/dashboard/${companyId}/catalogs/create`}>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">New Catalog</span>
          </Button>
        </Link>
      </div>

      <ScrollArea className={`${isMobile ? "h-[calc(100vh-10rem)]" : "h-[calc(100vh-12rem)]"}`}>
        <ul className="space-y-1">
          {isLoading &&
            [...Array(5)].map((_, i) => (
              <li key={i} className="mb-1">
                <Skeleton className="h-10 w-full rounded-md" />
              </li>
            ))}
          {isError && !isLoading && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-destructive">Failed to load catalogs. Please try again.</p>
              </CardContent>
            </Card>
          )}
          {!isLoading &&
            !isError &&
            catalogs &&
            catalogs.map((catalog) => (
              <CatalogSidebarItem
                key={catalog.id}
                catalog={catalog}
                companyId={companyId}
                isActive={isCatalogActive(catalog.slug)}
                onSelect={onCatalogSelect}
              />
            ))}
          {!isLoading && !isError && catalogs && catalogs.length === 0 && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  No catalogs yet. Create your first catalog to get started.
                </p>
                <Link href={`/dashboard/${companyId}/catalogs/create`}>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Catalog
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </ul>
      </ScrollArea>
    </nav>
  )
}
