import React from 'react';
import { createClient } from '@/lib/supabase/server'; // Use server client
import { getCatalogBySlug, getProductsByCatalog } from '@/lib/data/catalogs';
import ProductCard from '@/components/product-card'; // Re-use the card
import { notFound } from 'next/navigation';
import { type ProductWithDetails } from '@/lib/data/products';

// Basic Metadata (can be enhanced)
export async function generateMetadata({ params }: { params: { company_id: string; catalog_slug: string } }) {
    const supabase = await createClient();
    const companyId = parseInt(params.company_id, 10);
    if (isNaN(companyId)) return { title: 'Catalog' }; // Default title

    const catalog = await getCatalogBySlug(supabase, companyId, params.catalog_slug);
    return {
        title: catalog ? `${catalog.name} Catalog` : 'Catalog Not Found',
        // Add description, etc.
    };
}

export default async function PublicCatalogPage({ params }: {
    params: { company_id: string; catalog_slug: string };
}) {
    const supabase = await createClient();
    const companyId = parseInt(params.company_id, 10);

    // Validate params
    if (isNaN(companyId) || !params.catalog_slug) {
        notFound(); // Use notFound for invalid routes
    }

    // Fetch catalog details
    const catalog = await getCatalogBySlug(supabase, companyId, params.catalog_slug);
    if (!catalog) {
        notFound(); // Catalog doesn't exist or doesn't belong to this company
    }

    // Fetch products for this catalog
    const products: ProductWithDetails[] = await getProductsByCatalog(supabase, catalog.id);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header with Company Name? Could fetch company details too */}
             <h1 className="text-3xl font-bold mb-6 text-center">{catalog.name}</h1>

             {/* Product Grid */}
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        // Note: ProductCard might have internal links/actions
                        // specific to the dashboard. Consider creating a
                        // simplified PublicProductCard or passing a flag if needed.
                        <ProductCard key={product.id} product={product} sellerId={params.company_id} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 mt-10">No products found in this catalog.</p>
            )}

            {/* Optional Footer */}
            {/* <footer className="mt-12 text-center text-sm text-gray-500"> */}
            {/*     Powered by Shelfie */}
            {/* </footer> */}
        </div>
    );
} 