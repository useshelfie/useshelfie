"use client"; // Needs to be client for hooks, DND, virtualization

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Use client Supabase
import { getCatalogBySlug, getProductsByCatalog, getProductsByCompanyExcludingCatalog } from '@/lib/data/catalogs';
import { addProductToCatalogAction, removeProductFromCatalogAction } from '../actions'; // Use actions from parent folder
import { type CatalogDatabaseData } from '@/schemas/catalogSchema';
import { type ProductDatabaseData } from '@/schemas/productSchema';
import { useCatalogStore } from "@/stores/catalogStore"; // Import the store
import type { CatalogState } from "@/stores/catalogStore"; // Import type
import { DndContext, useDroppable, closestCenter, DragOverlay, DragEndEvent, DragStartEvent, DragOverEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'; // Add sensors
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

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
      catalogId: product.catalog_id // Include current catalog ID (Ensure productSchema includes this)
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
      {product.price && <p className="text-sm text-muted-foreground">Price: {product.price}</p>}
      {/* Add more product details if needed */}
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  title: string;
  products: ProductDatabaseData[];
  catalogId: number | null; // Null for the "Available Products" column
}

function DroppableColumn({ id, title, products, catalogId }: DroppableColumnProps) {
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
          <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {products.length > 0 ? (
              products.map(product => <DraggableProductItem key={product.id} product={product} />)
            ) : (
              <div className="text-sm text-muted-foreground h-full flex items-center justify-center">
                {id === 'catalog-products' ? 'Drag products here' : 'No available products'}
              </div>
            )}
          </SortableContext>
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

  const [catalog, setCatalog] = useState<CatalogDatabaseData | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<ProductDatabaseData[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductDatabaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null); // For DragOverlay

  const supabase = createClient();
  const refetchTrigger = useCatalogStore((state: CatalogState) => state.refetchTrigger);
  const triggerCatalogProductRefetch = useCatalogStore((state: CatalogState) => state.triggerCatalogProductRefetch);

  const fetchCatalogData = useCallback(async () => {
    if (!companyId || !catalogSlug) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCatalog = await getCatalogBySlug(supabase, companyId, catalogSlug);
      if (!fetchedCatalog) throw new Error("Catalog not found.");
      setCatalog(fetchedCatalog);

      const [fetchedCatalogProducts, fetchedAvailableProducts] = await Promise.all([
        getProductsByCatalog(supabase, fetchedCatalog.id),
        getProductsByCompanyExcludingCatalog(supabase, companyId, fetchedCatalog.id)
      ]);
      setCatalogProducts(fetchedCatalogProducts);
      setAvailableProducts(fetchedAvailableProducts);

    } catch (err: any) {
      console.error("Error fetching catalog data:", err);
      setError(err.message || "Failed to load catalog details.");
      setCatalog(null);
      setCatalogProducts([]);
      setAvailableProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, catalogSlug, supabase, refetchTrigger]);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeContainerId = active.data.current?.sortable?.containerId;
    const overContainerId = over.data.current?.sortable?.containerId || over.id;

    // ** Temporarily disable optimistic updates in handleDragOver **
    /*
    if (activeContainerId !== overContainerId && (overContainerId === 'catalog-products' || overContainerId === 'available-products')) {
      const activeList = activeContainerId === 'catalog-products' ? catalogProducts : availableProducts;
      const overList = overContainerId === 'catalog-products' ? catalogProducts : availableProducts;
      const activeIndex = activeList.findIndex(p => p.id === active.id);
      const overIndex = overList.findIndex(p => p.id === over.id);
      const targetIndex = over.id === overContainerId ? overList.length : overIndex;

      if (activeIndex !== -1) {
        const movedItem = activeList[activeIndex];

        if (activeContainerId === 'catalog-products') {
          setCatalogProducts((items) => items.filter(item => item.id !== active.id));
          setAvailableProducts((items) => {
            const insertIndex = targetIndex >= 0 ? targetIndex : items.length;
            return [...items.slice(0, insertIndex), movedItem, ...items.slice(insertIndex)];
          });
        } else {
          setAvailableProducts((items) => items.filter(item => item.id !== active.id));
          setCatalogProducts((items) => {
            const insertIndex = targetIndex >= 0 ? targetIndex : items.length;
            return [...items.slice(0, insertIndex), movedItem, ...items.slice(insertIndex)];
          });
        }
      }
    }
    */
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      console.log("Drag ended outside a valid target.");
      fetchCatalogData(); // Refetch to ensure consistency
      return;
    }

    const activeContainerId = active.data.current?.sortable?.containerId;
    const overContainerId = over.data.current?.sortable?.containerId || over.id;

    if (activeContainerId === overContainerId) {
      console.log("Drag ended in the same column, no action needed.");
      fetchCatalogData();
      return;
    }

    const productId = active.id as string;
    const productName = active.data.current?.productName || 'Product';
    const originalCatalogId = active.data.current?.catalogId;
    const targetColumnData = over.id === 'catalog-products' || over.id === 'available-products'
      ? over.data.current
      : over.data.current?.droppableContainer?.data.current;
    const targetCatalogId = targetColumnData?.catalogId;

    console.log(`Product: ${productId}, Name: ${productName}, Origin Catalog: ${originalCatalogId}, Target Column: ${overContainerId}, Target Catalog ID: ${targetCatalogId}`);

    if (overContainerId === 'catalog-products' && catalog && targetCatalogId === catalog.id) {
      console.log(`Adding product ${productId} to catalog ${catalog.id}`);
      try {
        const result = await addProductToCatalogAction(productId, catalog.id);
        if (result.type === 'success') {
          toast.success(`'${productName}' added to catalog '${catalog.name}'.`);
          triggerCatalogProductRefetch();
        } else {
          toast.error(result.message, { description: result.errors?.database?.[0] });
          fetchCatalogData(); // Revert optimistic move on error
        }
      } catch (error) {
        console.error("Failed to add product via action:", error);
        toast.error("Failed to add product.");
        fetchCatalogData(); // Revert optimistic move on error
      }
    } else if (activeContainerId === 'catalog-products' && overContainerId === 'available-products') {
      console.log(`Removing product ${productId} from catalog ${originalCatalogId}`);
      try {
        const result = await removeProductFromCatalogAction(productId);
        if (result.type === 'success') {
          toast.success(`'${productName}' removed from catalog.`);
          triggerCatalogProductRefetch();
        } else {
          toast.error(result.message, { description: result.errors?.database?.[0] });
          fetchCatalogData(); // Revert optimistic move on error
        }
      } catch (error) {
        console.error("Failed to remove product via action:", error);
        toast.error("Failed to remove product.");
        fetchCatalogData(); // Revert optimistic move on error
      }
    } else {
      console.log("Drag ended, but conditions for action not met (e.g., invalid target, unexpected state). Final Target Column:", overContainerId);
      fetchCatalogData(); // Refetch to ensure UI consistency
    }
  };

  const activeProduct = activeId ? (catalogProducts.find(p => p.id === activeId) || availableProducts.find(p => p.id === activeId)) : null;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="flex gap-4 flex-grow">
          <Skeleton className="flex-1 rounded-lg" />
          <Skeleton className="flex-1 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!catalog) {
    return <div className="p-6">Catalog not found.</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="p-6 h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-4 flex-shrink-0">Catalog: {catalog.name}</h1>
        <div className="flex gap-4 flex-grow min-h-0">
          <DroppableColumn id="available-products" title="Available Products" products={availableProducts} catalogId={null} />
          <DroppableColumn id="catalog-products" title="Products in this Catalog" products={catalogProducts} catalogId={catalog.id} />
        </div>
      </div>
      <DragOverlay>
        {activeId && activeProduct ? <DraggableProductItem product={activeProduct} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
} 