"use client"; // Make this a client component

import React, { useEffect } from 'react'; // Removed useState
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Use client-side hook for params
import { createClient } from '@/lib/supabase/client'; // Use client-side Supabase client
import { getCatalogsByCompany } from '@/lib/data/catalogs'; // Keep using server function for type safety, but call with client
import { DeleteCatalogButton } from '@/components/delete-catalog-button';
import { type CatalogDatabaseData } from "@/schemas/catalogSchema"; // Import type
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { toast } from 'sonner';
import { updateProductCatalogAction } from './actions'; // We need a server action for DND update
import { useCatalogStore } from "@/stores/catalogStore"; // Import the store
import type { CatalogState } from "@/stores/catalogStore";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"; // Import Resizable components
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import React Query hooks

// --- CatalogSidebarNav Component ---
interface CatalogSidebarNavProps {
    companyId: number;
    catalogs: CatalogDatabaseData[] | undefined; // Can be undefined while loading
    isLoading: boolean;
    isError: boolean; // Added isError prop
}

function CatalogDroppableItem({ catalog, companyId }: { catalog: CatalogDatabaseData; companyId: number }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `catalog-drop-${catalog.id}`,
        data: { // Pass catalog data for the onDragEnd handler
            type: 'catalog',
            catalogId: catalog.id,
            catalogName: catalog.name // Pass name for toast message
        }
    });

    const style = {
        backgroundColor: isOver ? 'rgba(0, 128, 0, 0.1)' : undefined, // Highlight when dragging over
        borderRadius: '4px',
        padding: '1px' // Add padding to make highlight visible
    };

    return (
        <li ref={setNodeRef} style={style} key={catalog.id} className="flex items-center justify-between group mb-1 pr-1">
            <Link href={`/dashboard/${companyId}/catalogs/${catalog.slug}`}
                  className="flex-1 block px-2 py-1 text-blue-600 hover:bg-gray-200 rounded mr-1 truncate">
                {catalog.name}
            </Link>
            <DeleteCatalogButton
                companyId={companyId}
                catalogId={catalog.id}
                catalogName={catalog.name}
                className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity duration-150"
            />
        </li>
    )
}

function CatalogSidebarNav({ companyId, catalogs, isLoading, isError }: CatalogSidebarNavProps) { // Added isError
    return (
        <nav className="mt-4">
            <div className="flex justify-between items-center mb-2 px-2">
                <h2 className="text-lg font-semibold">Catalogs</h2>
                <Link href={`/dashboard/${companyId}/catalogs/create`}
                      className="p-1 bg-green-500 text-white rounded text-xs leading-none">
                    + New
                </Link>
            </div>
            <ul>
                {isLoading && (
                    [...Array(3)].map((_, i) => (
                        <li key={i} className='mb-2 px-2'>
                            <Skeleton className="h-6 w-full" />
                        </li>
                    ))
                )}
                {isError && !isLoading && ( // Show error message
                    <li className="px-2 text-red-500 text-sm">Failed to load catalogs.</li>
                )}
                {!isLoading && !isError && catalogs && catalogs.map(catalog => (
                    <CatalogDroppableItem key={catalog.id} catalog={catalog} companyId={companyId} />
                ))}
                {!isLoading && !isError && catalogs && catalogs.length === 0 && (
                    <li className="px-2 text-gray-500 text-sm">No catalogs yet.</li>
                )}
            </ul>
        </nav>
    );
}

// --- CatalogLayout Component ---
export default function CatalogLayout({ children }: { children: React.ReactNode }) {
    const params = useParams(); // Get params client-side
    const companyIdStr = Array.isArray(params.company_id) ? params.company_id[0] : params.company_id;
    const companyId = parseInt(companyIdStr || '0', 10);

    const supabase = createClient(); // Get client instance
    const queryClient = useQueryClient(); // Get Query Client instance
    const triggerCatalogProductRefetch = useCatalogStore((state: CatalogState) => state.triggerCatalogProductRefetch);

    // Fetch catalogs using useQuery
    const {
        data: catalogsData,
        isLoading: isLoadingCatalogs,
        isError: isErrorCatalogs,
        error: errorCatalogs // Can use this for more detailed error logging if needed
    } = useQuery({
        queryKey: ['catalogs', companyId], // Query key includes companyId
        queryFn: async () => {
            if (!companyId) return []; // Return empty if companyId is invalid
            // Ensure getCatalogsByCompany is compatible or wrap it
            // Assuming getCatalogsByCompany returns Promise<CatalogDatabaseData[]>
             const data = await getCatalogsByCompany(supabase, companyId);
             // React Query handles errors, but we can log here if needed
             // console.log("Fetched catalogs:", data);
             return data;
        },
        enabled: !!companyId && companyId > 0, // Only run query if companyId is valid
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
            // Call the server action
            return updateProductCatalogAction(productId, newCatalogId);
        },
        onSuccess: (result, variables) => {
            const { newCatalogId } = variables;
            const productName = queryClient.getQueryData<CatalogDatabaseData[]>(['catalogs', companyId])
                                ?.find(c => c.id === newCatalogId)?.name || 'Unknown Catalog'; // Get name from cache

            if (result.type === 'success') {
                toast.success(`Product moved to catalog '${productName}'.`);
                // Invalidate catalog query to ensure sidebar is up-to-date if needed (though it doesn't change here)
                // queryClient.invalidateQueries({ queryKey: ['catalogs', companyId] });
                // Trigger refetch for product lists (assuming child components handle this)
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
            // const productName = active.data.current?.productName || 'Product'; // Use cached catalog name instead

            if (oldCatalogId === newCatalogId) {
                console.log("Product dropped in the same catalog.");
                return;
            }

            console.log(`Moving product ${productId} from catalog ${oldCatalogId} to ${newCatalogId}`);

            // Call the mutation
            updateProductCatalogMutation.mutate({ productId, newCatalogId });
        }
        // TODO: Add logic for dragging a product *out* of a catalog
    }

    if (isNaN(companyId) || companyId <= 0) {
        return <div>Invalid Company ID in Layout</div>;
    }

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <ResizablePanelGroup
                direction="horizontal"
                className="h-screen w-full rounded-lg border"
            >
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    {/* Sidebar Area */}
                    <div className="flex h-full flex-col items-start justify-start p-4">
                        <h1 className="text-xl font-bold mb-4">Catalogs</h1>
                        {/* Pass React Query state to sidebar */}
                        <CatalogSidebarNav
                            companyId={companyId}
                            catalogs={catalogsData}
                            isLoading={isLoadingCatalogs}
                            isError={isErrorCatalogs}
                        />
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={80}>
                    {/* Main Content Area */}
                    <main className="flex-1 h-full overflow-y-auto p-6">
                         {/* Need to handle case where no specific catalog page is loaded yet */}
                        {children}
                    </main>
                </ResizablePanel>
            </ResizablePanelGroup>
        </DndContext>
    );
} 