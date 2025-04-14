"use client"; // Needs to be client for hooks, DND, virtualization

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCatalogBySlug, getProductsByCatalog, getProductsByCompanyExcludingCatalog } from '@/lib/data/catalogs';
import { addProductToCatalogAction, removeProductFromCatalogAction } from '../actions';
import { type CatalogDatabaseData } from '@/schemas/catalogSchema';
import { type ProductDatabaseData } from '@/schemas/productSchema';
import { DndContext, useDroppable, closestCenter, DragOverlay, DragEndEvent, DragStartEvent, DragOverEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Trash2, Search, Grip, Share2 } from 'lucide-react';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonLoader } from "@/components/ui/skeleton-loader";

// Product List components optimized for both desktop and mobile
interface ProductCardProps {
  product: ProductDatabaseData;
  isInCatalog: boolean;
  onAdd?: (productId: string) => void;
  onRemove?: (productId: string) => void;
  isDraggable?: boolean;
}

// Enhanced product card that works both for drag-and-drop and for mobile tap interactions
function ProductCard({ 
  product, 
  isInCatalog, 
  onAdd, 
  onRemove, 
  isDraggable = false 
}: ProductCardProps) {
  // Only use the sortable hook if the product is draggable (desktop mode)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = isDraggable ? useSortable({
    id: product.id,
    data: {
      type: 'product',
      productName: product.name,
      catalogId: product.catalog_id
    }
  }) : { attributes: {}, listeners: {}, setNodeRef: null, transform: null, transition: null, isDragging: false };

  // Determine styles based on whether this is draggable
  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'none',
  } : {};

  // The actual component to render
  const cardContent = (
    <div className={`relative rounded-md border p-3 mb-2 hover:shadow-sm transition-shadow ${isInCatalog ? 'bg-primary/5' : 'bg-card'}`}>
      <div className="flex justify-between">
        <div className="flex-1 mr-2">
          <div className="font-medium line-clamp-1">{product.name}</div>
          {product.price != null && (
            <div className="text-sm text-muted-foreground flex items-center mt-1">
              <DollarSign className="h-3 w-3 mr-1" />
              {product.price}
            </div>
          )}
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
        
        {/* Action buttons depend on if we're in catalog or not */}
        <div className="flex items-start space-x-1">
          {isDraggable && isInCatalog && (
            <div className="cursor-grab text-muted-foreground hover:text-primary p-1">
              <Grip className="h-4 w-4" />
            </div>
          )}
          
          {!isDraggable && (
            isInCatalog ? (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive" 
                onClick={() => onRemove?.(product.id)}
                title="Remove from catalog"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7 text-primary hover:text-primary" 
                onClick={() => onAdd?.(product.id)}
                title="Add to catalog"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );

  // If the product is draggable, we need to wrap it with the necessary refs and listeners
  return isDraggable && setNodeRef ? (
    <div ref={setNodeRef} style={style as React.CSSProperties} {...attributes} {...listeners}>
      {cardContent}
    </div>
  ) : cardContent;
}

// This will wrap both the draggable and non-draggable components
function DraggableProductItem({ product, isOverlay = false }: { product: ProductDatabaseData; isOverlay?: boolean }) {
  return (
    <ProductCard 
      product={product} 
      isInCatalog={true} 
      isDraggable={true} 
    />
  );
}

// Modified droppable column components to include search
interface DroppableColumnProps {
  id: string;
  title: string;
  products: ProductDatabaseData[] | undefined;
  isLoading: boolean;
  isError: boolean;
  catalogId: number | null;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onAddProduct?: (productId: string) => void;
  onRemoveProduct?: (productId: string) => void;
  showSearch?: boolean;
}

function DroppableColumn({ 
  id, 
  title, 
  products, 
  isLoading, 
  isError, 
  catalogId,
  searchTerm = '',
  onSearchChange,
  onAddProduct,
  onRemoveProduct,
  showSearch = false
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: 'column',
      accepts: 'product',
      catalogId: catalogId
    }
  });

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!products || !searchTerm.trim()) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  return (
    <Card 
      className={`flex-1 flex flex-col border ${isOver ? 'border-primary border-dashed' : ''}`} 
      ref={setNodeRef}
    >
      <CardHeader className={`${showSearch ? 'pb-2' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {filteredProducts && (
            <Badge variant="outline">{filteredProducts.length}</Badge>
          )}
        </div>
        
        {/* Optional search input */}
        {showSearch && (
          <div className="mt-2 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <SkeletonLoader key={i} height={70} className="mb-2" />)}
          </div>
        )}
        
        {!isLoading && isError && (
          <div className="text-sm text-destructive h-full flex items-center justify-center">
            Failed to load products
          </div>
        )}
        
        {!isLoading && !isError && (
          <ScrollArea className="flex-1 pr-3 -mr-3">
            <SortableContext items={filteredProducts?.map(p => p.id) ?? []} strategy={verticalListSortingStrategy}>
              {filteredProducts && filteredProducts.length > 0 ? (
                <div className="space-y-1">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isInCatalog={id === 'catalog-products'}
                      isDraggable={true}
                      onAdd={onAddProduct}
                      onRemove={onRemoveProduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground h-20 flex items-center justify-center">
                  {searchTerm.trim() ? 'No matching products found' : 
                  id === 'catalog-products' ? 'Drag products here or use the + button' : 'No available products'}
                </div>
              )}
            </SortableContext>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Mobile product list component (no drag and drop, just tap interactions)
function MobileProductList({
  title,
  products,
  isLoading,
  isError,
  isInCatalog,
  searchTerm = '',
  onSearchChange,
  onAddProduct,
  onRemoveProduct,
  showSearch = false,
  emptyMessage
}: {
  title: string;
  products: ProductDatabaseData[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isInCatalog: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onAddProduct?: (productId: string) => void;
  onRemoveProduct?: (productId: string) => void;
  showSearch?: boolean;
  emptyMessage: string;
}) {
  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!products || !searchTerm.trim()) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className={`${showSearch ? 'pb-2' : ''}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {filteredProducts && (
            <Badge variant="outline">{filteredProducts?.length}</Badge>
          )}
        </div>
        
        {/* Optional search input */}
        {showSearch && (
          <div className="mt-2 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col mt-4">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <SkeletonLoader key={i} height={70} className="mb-2" />)}
          </div>
        )}
        
        {!isLoading && isError && (
          <div className="text-sm text-destructive h-full flex items-center justify-center">
            Failed to load products
          </div>
        )}
        
        {!isLoading && !isError && (
          <ScrollArea className="flex-1">
            {filteredProducts && filteredProducts.length > 0 ? (
              <div className="space-y-1">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isInCatalog={isInCatalog}
                    isDraggable={false}
                    onAdd={onAddProduct}
                    onRemove={onRemoveProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground h-20 flex items-center justify-center">
                {searchTerm.trim() ? 'No matching products found' : emptyMessage}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

// Main component
export default function CatalogDetailPage() {
  const params = useParams();
  const companyId = parseInt(Array.isArray(params.company_id) ? params.company_id[0] : params.company_id || '0', 10);
  const catalogSlug = Array.isArray(params.catalog_slug) ? params.catalog_slug[0] : params.catalog_slug || '';

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [availableSearchTerm, setAvailableSearchTerm] = useState('');
  
  // Use our media query hook to determine if we should show desktop or mobile UI
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const supabase = createClient();
  const queryClient = useQueryClient();

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
      if (!fetchedCatalog) throw new Error("Catalog not found.");
      return fetchedCatalog;
    },
    enabled: !!companyId && companyId > 0 && !!catalogSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const catalogId = catalog?.id;

  // 2. Fetch Products IN the Catalog
  const {
    data: catalogProducts,
    isLoading: isLoadingCatalogProducts,
    isError: isErrorCatalogProducts,
  } = useQuery({
    queryKey: ['products', 'catalog', catalogId],
    queryFn: async () => {
      if (!catalogId) return [];
      return getProductsByCatalog(supabase, catalogId);
    },
    enabled: !!catalogId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });

  // 3. Fetch Products available for the Catalog (excluding those already in it)
  const {
    data: availableProducts,
    isLoading: isLoadingAvailableProducts,
    isError: isErrorAvailableProducts,
  } = useQuery({
    queryKey: ['products', 'available', companyId, catalogId],
    queryFn: async () => {
      if (!companyId || !catalogId) return [];
      return getProductsByCompanyExcludingCatalog(supabase, companyId, catalogId);
    },
    enabled: !!companyId && !!catalogId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });

  // Log errors
  useEffect(() => {
    if (errorCatalog) console.error("Error fetching catalog:", errorCatalog);
  }, [errorCatalog]);

  // --- React Query Mutations ---
  // Mutation to Add Product
  const addProductMutation = useMutation({
    mutationFn: (variables: { productId: string; catalogId: number }) =>
      addProductToCatalogAction(variables.productId, variables.catalogId),
    onSuccess: (result, variables) => {
      if (result.type === 'success') {
        const productName = 
          availableProducts?.find(p => p.id === variables.productId)?.name || 'Product';
        toast.success(`'${productName}' added to catalog.`);
        // Close drawer on mobile after successful add
        if (!isDesktop) {
          setIsDrawerOpen(false);
        }
        // Invalidate both product queries to refetch lists
        queryClient.invalidateQueries({ queryKey: ['products', 'catalog', variables.catalogId] });
        queryClient.invalidateQueries({ queryKey: ['products', 'available', companyId, variables.catalogId] });
      } else {
        toast.error(result.message, { description: result.errors?.database?.[0] });
      }
    },
    onError: (error) => {
      console.error("Failed to add product via mutation:", error);
      toast.error("Failed to add product.");
      if (catalogId) {
        queryClient.invalidateQueries({ queryKey: ['products', 'catalog', catalogId] });
        queryClient.invalidateQueries({ queryKey: ['products', 'available', companyId, catalogId] });
      }
    },
    onSettled: () => {
      setActiveId(null);
    }
  });

  // Mutation to Remove Product
  const removeProductMutation = useMutation({
    mutationFn: (variables: { productId: string }) =>
      removeProductFromCatalogAction(variables.productId),
    onSuccess: (result, variables) => {
      if (result.type === 'success') {
        const productName = catalogProducts?.find(p => p.id === variables.productId)?.name || 'Product';
        toast.success(`'${productName}' removed from catalog.`);
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
      if (catalogId) {
        queryClient.invalidateQueries({ queryKey: ['products', 'catalog', catalogId] });
        queryClient.invalidateQueries({ queryKey: ['products', 'available', companyId, catalogId] });
      }
    },
    onSettled: () => {
      setActiveId(null);
    }
  });

  // Handler functions
  const handleAddProduct = useCallback((productId: string) => {
    if (catalogId) {
      addProductMutation.mutate({ productId, catalogId });
    }
  }, [addProductMutation, catalogId]);

  const handleRemoveProduct = useCallback((productId: string) => {
    removeProductMutation.mutate({ productId });
  }, [removeProductMutation]);

  // --- DND Setup & Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Simplified for clarity
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeContainerId = active.data.current?.sortable?.containerId;
    const overContainerId = over.data.current?.sortable?.containerId || over.id;

    // Prevent action if dropped in the same column (or on itself)
    if (!overContainerId || activeContainerId === overContainerId || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const productId = active.id as string;
    const targetColumnData = over.id === 'catalog-products' || over.id === 'available-products'
      ? over.data.current
      : over.data.current?.droppableContainer?.data.current;
    const targetCatalogId = targetColumnData?.catalogId;

    // Moving TO 'catalog-products'
    if (overContainerId === 'catalog-products' && catalogId && targetCatalogId === catalogId) {
      addProductMutation.mutate({ productId, catalogId });
    }
    // Moving FROM 'catalog-products' TO 'available-products'
    else if (activeContainerId === 'catalog-products' && overContainerId === 'available-products') {
      removeProductMutation.mutate({ productId });
    }
    // Handle cases where product is dragged from sidebar
    else if (!activeContainerId && overContainerId === 'catalog-products' && catalogId && targetCatalogId === catalogId) {
      queryClient.invalidateQueries({ queryKey: ['products', 'catalog', catalogId] });
      queryClient.invalidateQueries({ queryKey: ['products', 'available', companyId, catalogId] });
      setActiveId(null);
    }
    else {
      setActiveId(null);
    }
  };

  // --- Render Logic ---
  if (!companyId || companyId <= 0 || !catalogSlug) {
    return <div className="p-6 text-destructive">Invalid parameters in URL</div>;
  }

  if (isLoadingCatalog) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className={`${isDesktop ? 'flex gap-4' : ''} h-[calc(100vh-150px)]`}>
          <Skeleton className="flex-1 h-full mb-4" />
          {isDesktop && <Skeleton className="flex-1 h-full" />}
        </div>
      </div>
    );
  }

  if (isErrorCatalog || !catalog) {
    return (
      <div className="p-6 text-destructive">
        {errorCatalog?.message || 'Catalog not found or failed to load.'}
      </div>
    );
  }

  // Find the product being dragged for the overlay
  const activeProduct = activeId
    ? catalogProducts?.find(p => p.id === activeId) || availableProducts?.find(p => p.id === activeId)
    : null;

  // Desktop UI
  if (isDesktop) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Catalog: {catalog.name}</h1>
              <Link href={`/public/catalogs/${companyId}/${catalogSlug}`} target="_blank">
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Share</span>
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {catalogProducts?.length || 0} products
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-4 flex-1 min-h-0">
            <DroppableColumn
              id="catalog-products"
              title="Products in Catalog"
              products={catalogProducts}
              isLoading={isLoadingCatalogProducts}
              isError={isErrorCatalogProducts}
              catalogId={catalog.id}
              searchTerm={catalogSearchTerm}
              onSearchChange={setCatalogSearchTerm}
              onRemoveProduct={handleRemoveProduct}
              showSearch={true}
            />
            <DroppableColumn
              id="available-products"
              title="Available Products"
              products={availableProducts}
              isLoading={isLoadingAvailableProducts}
              isError={isErrorAvailableProducts}
              catalogId={null}
              searchTerm={availableSearchTerm}
              onSearchChange={setAvailableSearchTerm}
              onAddProduct={handleAddProduct}
              showSearch={true}
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
  
  // Mobile UI
  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Catalog: {catalog.name}</h1>
          <Link href={`/public/catalogs/${companyId}/${catalogSlug}`} target="_blank">
            <Button variant="outline" size="icon" className="h-7 w-7">
              <Share2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Badge variant="outline" className="text-xs">
          {catalogProducts?.length || 0} products
        </Badge>
      </div>
      
      {/* Single column for products in catalog */}
      <Card className="flex-1 flex flex-col mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Products in Catalog</CardTitle>
            {catalogProducts && (
              <Badge variant="outline">{catalogProducts.length}</Badge>
            )}
          </div>
          
          <div className="mt-2 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search catalog products..."
              className="pl-8"
              value={catalogSearchTerm}
              onChange={(e) => setCatalogSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          {isLoadingCatalogProducts ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <SkeletonLoader key={i} height={70} className="mb-2" />)}
            </div>
          ) : isErrorCatalogProducts ? (
            <div className="text-sm text-destructive h-full flex items-center justify-center">
              Failed to load products
            </div>
          ) : (
            <MobileProductList
              title=""
              products={catalogProducts}
              isLoading={false}
              isError={false}
              isInCatalog={true}
              searchTerm={catalogSearchTerm}
              onRemoveProduct={handleRemoveProduct}
              emptyMessage="No products in catalog yet. Add some products using the button below."
            />
          )}
        </CardContent>
        
        <CardFooter className="pt-0">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Products
              </Button>
            </DrawerTrigger>
            <DrawerContent className="p-4 pt-0 h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>Available Products</DrawerTitle>
                <div className="mt-2 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search available products..."
                    className="pl-8"
                    value={availableSearchTerm}
                    onChange={(e) => setAvailableSearchTerm(e.target.value)}
                  />
                </div>
              </DrawerHeader>
              
              <div className="flex-1 mt-2 mb-16"> {/* Add bottom padding for the footer */}
                {isLoadingAvailableProducts ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <SkeletonLoader key={i} height={70} className="mb-2" />)}
                  </div>
                ) : isErrorAvailableProducts ? (
                  <div className="text-sm text-destructive h-full flex items-center justify-center">
                    Failed to load available products
                  </div>
                ) : (
                  <MobileProductList
                    title=""
                    products={availableProducts}
                    isLoading={false}
                    isError={false}
                    isInCatalog={false}
                    searchTerm={availableSearchTerm}
                    onAddProduct={handleAddProduct}
                    emptyMessage="No available products to add"
                  />
                )}
              </div>
              
              <DrawerFooter className="pt-2">
                <DrawerClose asChild>
                  <Button variant="outline">Done</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </CardFooter>
      </Card>
    </div>
  );
} 