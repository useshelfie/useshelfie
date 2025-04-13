import React from 'react';

// TODO: Implement CatalogList component
// TODO: Implement ProductGrid component (potentially virtualized with react-window)
// TODO: Set up state/context for selected catalog
// TODO: Implement drag-and-drop context (@dnd-kit)

export default async function CatalogsPage({ params }: { params: { company_id: string } }) {
    const companyId = parseInt(params.company_id, 10);

    if (isNaN(companyId)) {
        return <div>Invalid company ID</div>;
    }

    // Keep the main div but replace content with a prompt
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
                Select a catalog from the sidebar to view or manage its products, or create a new one.
            </p>
        </div>
    );
} 