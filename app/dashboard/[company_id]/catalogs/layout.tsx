"use client"; // Make this a client component

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCatalogsByCompany } from '@/lib/data/catalogs';
import { DeleteCatalogButton } from '@/components/delete-catalog-button';
import { type CatalogDatabaseData } from "@/schemas/catalogSchema";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { toast } from 'sonner';
import { updateProductCatalogAction } from './actions';
import { useCatalogStore } from "@/stores/catalogStore";
import type { CatalogState } from "@/stores/catalogStore";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

// Import Shadcn components
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import icons
import { PlusCircle, Layers, Menu, X, ChevronRight } from 'lucide-react';

// --- CatalogSidebarNav Component ---
interface CatalogSidebarNavProps {
    companyId: number;
    catalogs: CatalogDatabaseData[] | undefined;
    isLoading: boolean;
    isError: boolean;
    isMobile?: boolean;
    onCatalogSelect?: () => void; // For mobile to close drawer when selected
}

function CatalogDroppableItem({ 
  catalog, 
  companyId, 
  isActive = false,
  onSelect
}: { 
  catalog: CatalogDatabaseData; 
  companyId: number;
  isActive?: boolean;
  onSelect?: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `catalog-drop-${catalog.id}`,
        data: {
            type: 'catalog',
            catalogId: catalog.id,
            catalogName: catalog.name
        }
    });

    return (
        <li 
          ref={setNodeRef} 
          key={catalog.id} 
          className={`
            mb-1 overflow-hidden rounded-md
            ${isOver ? 'ring-2 ring-primary ring-offset-1' : ''}
            ${isActive ? 'bg-muted' : 'hover:bg-muted/50'}
          `}
        >
            <Link 
              href={`/dashboard/${companyId}/catalogs/${catalog.slug}`}
              onClick={onSelect}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
                <span className="flex-1 mr-2 truncate">{catalog.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-sm h-5 px-1.5 text-[10px]">
                    {(catalog as any).product_count || 0}
                  </Badge>
                  <DeleteCatalogButton
                      companyId={companyId}
                      catalogId={catalog.id}
                      catalogName={catalog.name}
                      className="opacity-0 group-hover:opacity-100 h-5 w-5"
                  />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
            </Link>
        </li>
    )
}

function CatalogSidebarNav({ 
  companyId, 
  catalogs, 
  isLoading, 
  isError,
  isMobile,
  onCatalogSelect
}: CatalogSidebarNavProps) {
    const pathname = usePathname();
    
    // Determine if a catalog is active based on URL
    const isCatalogActive = (slug: string) => {
      return pathname?.includes(`/catalogs/${slug}`);
    };

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
            
            <ScrollArea className={`${isMobile ? 'h-[calc(100vh-10rem)]' : 'h-[calc(100vh-12rem)]'}`}>
              <ul className="space-y-1">
                  {isLoading && (
                      [...Array(5)].map((_, i) => (
                          <li key={i} className="mb-1">
                              <Skeleton className="h-10 w-full rounded-md" />
                          </li>
                      ))
                  )}
                  {isError && !isLoading && (
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-destructive">
                            Failed to load catalogs. Please try again.
                          </p>
                        </CardContent>
                      </Card>
                  )}
                  {!isLoading && !isError && catalogs && catalogs.map(catalog => (
                      <CatalogDroppableItem 
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
    );
}

// --- CatalogLayout Component ---
export default function CatalogLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const companyIdStr = Array.isArray(params.company_id) ? params.company_id[0] : params.company_id;
    const companyId = parseInt(companyIdStr || '0', 10);
    
    // Check if we're on mobile
    const isDesktop = useMediaQuery('(min-width: 768px)');
    
    // State to control mobile sidebar
    const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

    const supabase = createClient();
    const queryClient = useQueryClient();
    const triggerCatalogProductRefetch = useCatalogStore((state: CatalogState) => state.triggerCatalogProductRefetch);

    // Fetch catalogs using useQuery
    const {
        data: catalogsData,
        isLoading: isLoadingCatalogs,
        isError: isErrorCatalogs,
        error: errorCatalogs
    } = useQuery({
        queryKey: ['catalogs', companyId],
        queryFn: async () => {
            if (!companyId) return [];
            const data = await getCatalogsByCompany(supabase, companyId);
            return data;
        },
        enabled: !!companyId && companyId > 0,
        staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
    });

    // Log error if exists
    useEffect(() => {
        if (errorCatalogs) {
             console.error("Failed to fetch catalogs:", errorCatalogs);
        }
    }, [errorCatalogs]);

    // Mutation for updating product catalog
    const updateProductCatalogMutation = useMutation({
        mutationFn: async ({ productId, newCatalogId }: { productId: string; newCatalogId: number }) => {
            return updateProductCatalogAction(productId, newCatalogId);
        },
        onSuccess: (result, variables) => {
            const { newCatalogId } = variables;
            const catalogName = catalogsData?.find(c => c.id === newCatalogId)?.name || 'Unknown Catalog';

            if (result.type === 'success') {
                toast.success(`Product moved to catalog '${catalogName}'.`);
                triggerCatalogProductRefetch();
            } else {
                toast.error(result.message || "Failed to move product.", {
                    description: result.errors?.database?.[0]
                });
            }
        },
        onError: (error) => {
            console.error("Failed to update product catalog via mutation:", error);
            toast.error("An unexpected error occurred while moving the product.");
        },
    });

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    // DND Drag End Handler - Updated to use mutation
    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.data.current?.type === 'product' && over.data.current?.type === 'catalog') {
            const productId = active.id as string;
            const oldCatalogId = active.data.current?.catalogId;
            const newCatalogId = over.data.current?.catalogId as number;

            if (oldCatalogId === newCatalogId) {
                return;
            }

            updateProductCatalogMutation.mutate({ productId, newCatalogId });
        }
    }

    if (isNaN(companyId) || companyId <= 0) {
        return (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-xl font-bold text-destructive">Invalid Company ID</h1>
              <p className="text-muted-foreground mt-2">Please check the URL and try again.</p>
            </div>
          </div>
        );
    }

    // Desktop layout
    if (isDesktop) {
      return (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                      <div className="h-full p-4 w-fit flex w-full">
                        <div className="w-90 border-r pr-4">
                            <CatalogSidebarNav
                                companyId={companyId}
                                catalogs={catalogsData}
                                isLoading={isLoadingCatalogs}
                                isError={isErrorCatalogs}
                            />
                        </div>
                        <main className="h-full overflow-y-auto w-full">
                            {children}
                        </main>
                      </div>
          </DndContext>
      );
    }
    
    // Mobile layout with Sheet for sidebar
    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </DndContext>
    );
} 