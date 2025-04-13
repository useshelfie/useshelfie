"use client"; // Make this a client component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // Use client-side hook for params
import { createClient } from '@/lib/supabase/client'; // Use client-side Supabase client
import { getCatalogsByCompany } from '@/lib/data/catalogs'; // Keep using server function for type safety, but call with client
import { DeleteCatalogButton } from '@/components/delete-catalog-button';
import { type CatalogDatabaseData } from "@/schemas/catalogSchema"; // Import type
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { updateProductCatalog } from '@/lib/data/catalogs'; // Need this for DND update
import { toast } from 'sonner';
import { updateProductCatalogAction } from './actions'; // We need a server action for DND update
import { useCatalogStore } from "@/stores/catalogStore"; // Import the store
import type { CatalogState } from "@/stores/catalogStore";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"; // Import Resizable components

// --- CatalogSidebarNav Component ---
interface CatalogSidebarNavProps {
    companyId: number;
    catalogs: CatalogDatabaseData[];
    isLoading: boolean;
}

function CatalogDroppableItem({ catalog, companyId }: { catalog: CatalogDatabaseData; companyId: number }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `catalog-drop-${catalog.id}`,
        data: { // Pass catalog data for the onDragEnd handler
            type: 'catalog',
            catalogId: catalog.id
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

function CatalogSidebarNav({ companyId, catalogs, isLoading }: CatalogSidebarNavProps) {
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
                {!isLoading && catalogs.map(catalog => (
                    <CatalogDroppableItem key={catalog.id} catalog={catalog} companyId={companyId} />
                ))}
                {!isLoading && catalogs.length === 0 && (
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

    const [catalogs, setCatalogs] = useState<CatalogDatabaseData[]>([]);
    const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
    const [errorCatalogs, setErrorCatalogs] = useState<string | null>(null);

    const supabase = createClient(); // Get client instance
    const triggerCatalogProductRefetch = useCatalogStore((state: CatalogState) => state.triggerCatalogProductRefetch);

    // Fetch catalogs on component mount
    useEffect(() => {
        if (!companyId) return;
        setIsLoadingCatalogs(true);
        getCatalogsByCompany(supabase, companyId)
            .then(data => {
                setCatalogs(data);
                setErrorCatalogs(null);
            })
            .catch(err => {
                console.error("Failed to fetch catalogs:", err);
                setErrorCatalogs("Failed to load catalogs.");
                setCatalogs([]); // Clear catalogs on error
            })
            .finally(() => setIsLoadingCatalogs(false));
    }, [companyId, supabase]); // Re-fetch if companyId changes

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    // DND Drag End Handler
    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        // Check if we are dragging a product over a catalog in the sidebar
        if (over && active.data.current?.type === 'product' && over.data.current?.type === 'catalog') {
            const productId = active.id as string;
            const oldCatalogId = active.data.current?.catalogId; // Get origin catalog ID from draggable item
            const newCatalogId = over.data.current?.catalogId as number;
            const productName = active.data.current?.productName || 'Product';

            if (oldCatalogId === newCatalogId) {
                console.log("Product dropped in the same catalog.");
                return; // No change needed
            }

            console.log(`Moving product ${productId} from catalog ${oldCatalogId} to ${newCatalogId}`);

            // Call server action to update the database
            try {
                 const result = await updateProductCatalogAction(productId, newCatalogId);
                 if (result.type === 'success') {
                     toast.success(`'${productName}' moved to catalog '${catalogs.find(c=>c.id === newCatalogId)?.name}'.`);
                     // Trigger refetch on success - This should refetch the products in the specific catalog page
                     triggerCatalogProductRefetch();
                 } else {
                     toast.error(result.message, {
                         description: result.errors?.database?.[0]
                     });
                 }
            } catch (error) {
                 console.error("Failed to update product catalog via action:", error);
                 toast.error("Failed to move product.");
            }
        }
        // TODO: Add logic for dragging a product *out* of a catalog (e.g., to an "unassigned" area)
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
                        {errorCatalogs && <p className="text-red-500 text-sm">{errorCatalogs}</p>}
                        <CatalogSidebarNav companyId={companyId} catalogs={catalogs} isLoading={isLoadingCatalogs} />
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