"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getCatalogsByCompany } from '@/lib/data/catalogs';

// Import Shadcn components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Import icons
import { PlusCircle, Layers, LayoutGrid, ArrowRight } from 'lucide-react';

// TODO: Implement CatalogList component
// TODO: Implement ProductGrid component (potentially virtualized with react-window)
// TODO: Set up state/context for selected catalog
// TODO: Implement drag-and-drop context (@dnd-kit)

export default function CatalogsPage() {
    const params = useParams();
    const companyId = parseInt(Array.isArray(params.company_id) ? params.company_id[0] : params.company_id || '0', 10);
    const supabase = createClient();

    const {
        data: catalogs,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['catalogs', companyId],
        queryFn: async () => {
            if (!companyId) return [];
            return getCatalogsByCompany(supabase, companyId);
        },
        enabled: !!companyId && companyId > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isNaN(companyId) || companyId <= 0) {
        return <div className="text-destructive p-6">Invalid company ID</div>;
    }

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-9 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-40 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    // Empty state when no catalogs exist
    if (!isLoading && (!catalogs || catalogs.length === 0)) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-120px)]">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center">
                            <Layers className="h-6 w-6 mr-2 text-primary" />
                            Create Your First Catalog
                        </CardTitle>
                        <CardDescription>
                            Catalogs help you organize products for different purposes or markets.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <p>With catalogs, you can:</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li>Group products by category, season, or collection</li>
                            <li>Share specific product collections with clients</li>
                            <li>Manage product availability across different sales channels</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Link href={`/dashboard/${companyId}/catalogs/create`} className="w-full">
                            <Button size="default" className="w-full">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Create Catalog
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Default view showing catalog grid
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Your Catalogs</h1>
                <Link href={`/dashboard/${companyId}/catalogs/create`}>
                    <Button size="default">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Catalog
                    </Button>
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalogs?.map((catalog) => (
                    <Link 
                        href={`/dashboard/${companyId}/catalogs/${catalog.slug}`}
                        key={catalog.id}
                        className="block group"
                    >
                        <Card className="h-full transition-shadow hover:shadow-md">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                        {catalog.name}
                                    </CardTitle>
                                    <Badge variant="outline">
                                        {(catalog as any).product_count || 0} products
                                    </Badge>
                                </div>
                                <CardDescription className="text-sm truncate">
                                    {(catalog as any).description || 'No description'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Layers className="h-4 w-4 mr-2" />
                                    <span>Last updated: {new Date(catalog.updated_at || catalog.created_at).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <div className="w-full flex justify-between items-center">
                                    <div className="flex">
                                        <LayoutGrid className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">View Products</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
} 