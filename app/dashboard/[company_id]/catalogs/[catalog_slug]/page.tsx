"use client"; // Needs to be client for hooks, DND, virtualization

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Use client Supabase
import { getCatalogBySlug, getProductsByCatalog, getProductsByCompanyExcludingCatalog } from '@/lib/data/catalogs';
import { addProductToCatalogAction, removeProductFromCatalogAction } from '../actions'; // Use actions from parent folder
import { type CatalogDatabaseData } from '@/schemas/catalogSchema';
import { type ProductDatabaseData } from '@/schemas/productSchema';
import { DndContext, useDroppable, closestCenter, DragOverlay, DragEndEvent, DragStartEvent, DragOverEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'; // Add sensors
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import React Query

// TODO: Implement drag-and-drop functionality (@dnd-kit)
// TODO: Implement virtualization if needed (react-window)
// TODO: Add filtering/searching UI and logic

// --- Draggable Product Item --- (Rendered by react-window)
interface DraggableProductItemProps {
  product: ProductDatabaseData;
  isOverlay?: boolean; // To style the item being dragged
}

function DraggableProductItem({ product, isOverlay = false }: DraggableProductItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    data: { // Pass product data for drag handlers
      type: 'product',
      productName: product.name,
      catalogId: product.catalog_id // Ensure this exists on ProductDatabaseData
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isOverlay ? 'grabbing' : 'grab',
    touchAction: 'none', // Prevent scrolling on touch devices when dragging
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`p-2 border rounded mb-2 bg-white ${isOverlay ? 'shadow-lg' : ''}`}>
      <p className="font-medium">{product.name}</p>
      {product.price != null && <p className="text-sm text-muted-foreground">Price: {product.price}</p>} {/* Handle potential null price */}
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  title: string;
  products: ProductDatabaseData[] | undefined; // Can be undefined when loading/error
  isLoading: boolean;
  isError: boolean;
  catalogId: number | null; // Null for the "Available Products" column
}

function DroppableColumn({ id, title, products, isLoading, isError, catalogId }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: 'column',
      accepts: 'product',
      catalogId: catalogId
    }
  });

  return (
    <Card className="flex-1 flex flex-col" ref={setNodeRef}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        <ScrollArea className="flex-1 -mx-4 px-4" style={{ backgroundColor: isOver ? 'rgba(0, 0, 255, 0.05)' : undefined }}>
          {isLoading && (
            // Consistent loading skeleton
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          )}
          {!isLoading && isError && (
            <div className="text-sm text-destructive h-full flex items-center justify-center">
              Failed to load products.
            </div>
          )}
          {!isLoading && !isError && (
            <SortableContext items={products?.map(p => p.id) ?? []} strategy={verticalListSortingStrategy}>
              {products && products.length > 0 ? (
                products.map(product => <DraggableProductItem key={product.id} product={product} />)
              ) : (
                <div className="text-sm text-muted-foreground h-full flex items-center justify-center">
                  {id === 'catalog-products' ? 'Drag products here' : 'No available products'}
                </div>
              )}
            </SortableContext>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// --- Catalog Page Component ---
export default function CatalogDetailPage() {
  const params = useParams();
  const companyId = parseInt(Array.isArray(params.company_id) ? params.company_id[0] : params.company_id || '0', 10);
  const catalogSlug = Array.isArray(params.catalog_slug) ? params.catalog_slug[0] : params.catalog_slug || '';

  const [activeId, setActiveId] = useState<string | null>(null); // For DragOverlay

  const supabase = createClient();
  const queryClient = useQueryClient(); // Get React Query client

  // --- React Query Data Fetching ---

  // 1. Fetch Catalog Details
  const {
    data: catalog,
    isLoading: isLoadingCatalog,
    isError: isErrorCatalog,
    error: errorCatalog,
  } = useQuery({
    queryKey: ['catalog', companyId, catalogSlug],
    queryFn: async () => {
      if (!companyId || !catalogSlug) return null;
      const fetchedCatalog = await getCatalogBySlug(supabase, companyId, catalogSlug);
      if (!fetchedCatalog) throw new Error("Catalog not found."); // Let React Query handle error state
      return fetchedCatalog;
    },
    enabled: !!companyId && companyId > 0 && !!catalogSlug, // Enable only if params are valid
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const catalogId = catalog?.id; // Derived catalog ID

  // 2. Fetch Products IN the Catalog
  const {
    data: catalogProducts,
    isLoading: isLoadingCatalogProducts,
    isError: isErrorCatalogProducts,
  } = useQuery({
    queryKey: ['products', 'catalog', catalogId],
    queryFn: async () => {
      if (!catalogId) return []; // Should not run if catalogId is missing
      return getProductsByCatalog(supabase, catalogId);
    },
    enabled: !!catalogId, // Enable only when catalogId is available
    staleTime: 1000 * 60 * 1, // 1 minute, might change frequently
  });

  // 3. Fetch Products available for the Catalog (excluding those already in it)
  const {
    data: availableProducts,
    isLoading: isLoadingAvailableProducts,
    isError: isErrorAvailableProducts,
  } = useQuery({
    queryKey: ['products', 'available', companyId, catalogId],
    queryFn: async () => {
      if (!companyId || !catalogId) return []; // Should not run if ids are missing
      return getProductsByCompanyExcludingCatalog(supabase, companyId, catalogId);
    },
    enabled: !!companyId && !!catalogId, // Enable only when both IDs are available
    staleTime: 1000 * 60 * 1, // 1 minute
  });

  // Log errors
  useEffect(() => {
      if (errorCatalog) console.error("Error fetching catalog:", errorCatalog);
      // Errors for product queries are handled via isError props in DroppableColumn
  }, [errorCatalog]);

  // --- React Query Mutations ---

  // Mutation to Add Product
  const addProductMutation = useMutation({
      mutationFn: (variables: { productId: string; catalogId: number }) =>
          addProductToCatalogAction(variables.productId, variables.catalogId),
      onSuccess: (result, variables) => {
          if (result.type === 'success') {
              const productName = activeId ? (catalogProducts?.find(p => p.id === activeId) || availableProducts?.find(p => p.id === activeId))?.name : 'Product';
              toast.success(`'${productName}' added to catalog '${catalog?.name}'.`);
              // Invalidate both product queries to refetch lists
              queryClient.invalidateQueries({ queryKey: ['products', 'catalog', variables.catalogId] });
              queryClient.invalidateQueries({ queryKey: ['products', 'available', companyId, variables.catalogId] });
          } else {
              toast.error(result.message, { description: result.errors?.database?.[0] });
              // No need to manually revert, invalidation will fetch the correct state
          }
      },
      onError: (error) => {
          console.error("Failed to add product via mutation:", error);
          toast.error("Failed to add product.");
          // Invalidate queries even on error to ensure UI consistency
          if (catalogId) {
              queryClient.invalidateQueries({ queryKey: ['products', 'catalog', catalogId] });
              queryClient.invalidateQueries({ queryKey: ['products', 'available', companyId, catalogId] });
          }
      },
      onSettled: () => {
          setActiveId(null); // Reset active dragging item
      }
  });

  // Mutation to Remove Product
  const removeProductMutation = useMutation({
      mutationFn: (variables: { productId: string }) =>
          removeProductFromCatalogAction(variables.productId),
      onSuccess: (result, variables) => {
          if (result.type === 'success') {
              const productName = activeId ? (catalogProducts?.find(p => p.id === activeId) || availableProducts?.find(p => p.id === activeId))?.name : 'Product';
              toast.success(`'${productName}' removed from catalog.`);
               // Invalidate both product queries
              if (catalogId) {
                queryClient.invalidateQueries({ queryKey: ['products', 'catalog', catalogId] });
                queryClient.invalidateQueries({ queryKey: ['products', 'available', companyId, catalogId] });
              }
          } else {
              toast.error(result.message, { description: result.errors?.database?.[0] });
          }
      },
      onError: (error) => {
          console.error("Failed to remove product via mutation:", error);
          toast.error("Failed to remove product.");
           // Invalidate queries even on error
          if (catalogId) {
            queryClient.invalidateQueries({ queryKey: ['products', 'catalog', catalogId] });
            queryClient.invalidateQueries({ queryKey: ['products', 'available', companyId, catalogId] });
          }
      },
      onSettled: () => {
          setActiveId(null); // Reset active dragging item
      }
  });

  // --- DND Setup & Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // handleDragOver can be simplified or removed if not doing complex optimistic updates
  const handleDragOver = (event: DragOverEvent) => {
     // console.log("Drag Over:", event); // Keep for debugging if needed
  };

  // Updated handleDragEnd to use mutations
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      console.log("Drag ended outside a valid target.");
      setActiveId(null); // Reset active ID even if dropped outside
      // No need to refetch manually, state relies on queries
      return;
    }

    const activeContainerId = active.data.current?.sortable?.containerId;
    const overContainerId = over.data.current?.sortable?.containerId || over.id;

    // Prevent action if dropped in the same column (or on itself)
    if (!overContainerId || activeContainerId === overContainerId || active.id === over.id) {
      console.log("Drag ended in the same column or on itself.");
       setActiveId(null);
      return;
    }

    const productId = active.id as string;
    const targetColumnData = over.id === 'catalog-products' || over.id === 'available-products'
      ? over.data.current
      : over.data.current?.droppableContainer?.data.current; // Get data from droppable container
    const targetCatalogId = targetColumnData?.catalogId; // Might be null for 'available-products'

    console.log(`Product: ${productId}, Origin Column: ${activeContainerId}, Target Column: ${overContainerId}, Target Catalog ID: ${targetCatalogId}`);

    // Moving TO 'catalog-products'
    if (overContainerId === 'catalog-products' && catalogId && targetCatalogId === catalogId) {
      console.log(`Attempting to add product ${productId} to catalog ${catalogId}`);
      addProductMutation.mutate({ productId, catalogId });
    }
    // Moving FROM 'catalog-products' TO 'available-products'
    else if (activeContainerId === 'catalog-products' && overContainerId === 'available-products') {
      console.log(`Attempting to remove product ${productId} from catalog`);
      removeProductMutation.mutate({ productId });
    }
    // Handle cases where product is dragged from sidebar (Layout component handles this)
    else if (!activeContainerId && overContainerId === 'catalog-products' && catalogId && targetCatalogId === catalogId) {
        console.log(`Product ${productId} dragged from outside into catalog ${catalogId}`);
        // The layout component's mutation already handled the DB update.
        // We just need to ensure our lists are up-to-date.
        queryClient.invalidateQueries({ queryKey: ['products', 'catalog', catalogId] });
        queryClient.invalidateQueries({ queryKey: ['products', 'available', companyId, catalogId] });
        setActiveId(null); // Reset active ID
    }
    else {
        console.log("Drag ended in unhandled scenario or invalid drop target.");
        setActiveId(null); // Reset active ID
    }

    // Reset activeId in onSettled of mutations now
    // setActiveId(null);
  };

  // --- Render Logic ---
  if (!companyId || companyId <= 0 || !catalogSlug) {
    return <div>Invalid parameters in URL.</div>;
  }

  if (isLoadingCatalog) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="flex gap-4 h-[calc(100vh-150px)]"> {/* Adjust height as needed */}
          <Skeleton className="flex-1" />
          <Skeleton className="flex-1" />
        </div>
      </div>
    );
  }

  if (isErrorCatalog) {
    return <div className="p-6 text-red-500">Error loading catalog: {errorCatalog?.message || 'Catalog not found or failed to load.'}</div>;
  }

  if (!catalog) {
     // Should be covered by isErrorCatalog, but as a fallback
     return <div className="p-6 text-gray-500">Catalog not found.</div>;
  }

  // Find the product being dragged for the overlay
  const activeProduct = activeId
    ? catalogProducts?.find(p => p.id === activeId) || availableProducts?.find(p => p.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="p-6 flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-4">Catalog: {catalog.name}</h1>
        <div className="flex gap-4 flex-1 min-h-0"> {/* Ensure flex container grows and children can scroll */}
          <DroppableColumn
            id="catalog-products"
            title="Products in Catalog"
            products={catalogProducts}
            isLoading={isLoadingCatalogProducts}
            isError={isErrorCatalogProducts}
            catalogId={catalog.id}
          />
          <DroppableColumn
            id="available-products"
            title="Available Products"
            products={availableProducts}
            isLoading={isLoadingAvailableProducts}
            isError={isErrorAvailableProducts}
            catalogId={null} // Indicates this is not a specific catalog
          />
        </div>
      </div>
      <DragOverlay>
        {activeId && activeProduct ? (
          <DraggableProductItem product={activeProduct} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
} 