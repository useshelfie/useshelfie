import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { CreateCatalogForm } from '@/components/forms/create-catalog-form';
import { notFound } from 'next/navigation';

// TODO: Implement CreateCatalogForm component
// TODO: Handle form submission (call createCatalog API)

export default async function CreateCatalogPage({ params }: { params: { company_id: string } }) {
  const companyId = parseInt(params.company_id, 10);
  if (isNaN(companyId)) {
    return <div>Invalid company ID</div>; // Or redirect/notFound()
  }

  // We need the user ID to associate with the catalog
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
     // Handle case where user is not logged in (should be protected by middleware ideally)
     notFound(); // Or redirect to login
  }

  return (
    <div className="flex justify-center pt-8">
      <CreateCatalogForm companyId={companyId} userId={user.id} />
    </div>
  );
} 