"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { catalogFormSchema, type CatalogFormData } from "@/schemas/catalogSchema"
import { createCatalog, updateCatalog, getCatalogBySlug, deleteCatalog, updateProductCatalog } from "@/lib/data/catalogs"

export type CatalogFormState = {
    message: string
    type: "success" | "error" | null
    errors?: {
        name?: string[]
        database?: string[]
    }
}

export async function createCatalogAction(
    companyId: number,
    userId: string, // Assuming we can get the user ID server-side
    prevState: CatalogFormState, // For useActionState
    formData: FormData
): Promise<CatalogFormState> {
    const validatedFields = catalogFormSchema.safeParse({
        name: formData.get("name"),
    })

    if (!validatedFields.success) {
        return {
            message: "Invalid form data.",
            type: "error",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { name } = validatedFields.data
    const supabase = await createClient()

    try {
        const newCatalog = await createCatalog(supabase, companyId, userId, name)
        // Revalidate the catalogs list page/layout
        revalidatePath(`/dashboard/${companyId}/catalogs`)
        // Redirect to the newly created catalog page
        redirect(`/dashboard/${companyId}/catalogs/${newCatalog.slug}`)
        // Note: Redirect throws an error, so the state below might not be reached unless caught.
        // return { message: `Catalog '${newCatalog.name}' created.`, type: "success" };
    } catch (error: any) {
        console.error("Database Error:", error)
        return {
            message: "Failed to create catalog.",
            type: "error",
            errors: { database: [error.message || "Unknown database error"] },
        }
    }
}

export async function updateCatalogAction(
    companyId: number,
    catalogId: number,
    prevState: CatalogFormState,
    formData: FormData
): Promise<CatalogFormState> {
    const validatedFields = catalogFormSchema.safeParse({
        name: formData.get("name"),
    })

    if (!validatedFields.success) {
        return {
            message: "Invalid form data.",
            type: "error",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { name } = validatedFields.data
    const supabase = await createClient()

    try {
        const updatedCatalog = await updateCatalog(supabase, catalogId, name)
        // Revalidate the specific catalog page and the list
        revalidatePath(`/dashboard/${companyId}/catalogs`)
        revalidatePath(`/dashboard/${companyId}/catalogs/${updatedCatalog.slug}`)
        revalidatePath(`/dashboard/${companyId}/catalogs/${updatedCatalog.slug}/edit`) // Revalidate edit page too
        return { message: `Catalog '${updatedCatalog.name}' updated.`, type: "success" }
    } catch (error: any) {
        console.error("Database Error:", error)
        return {
            message: "Failed to update catalog.",
            type: "error",
            errors: { database: [error.message || "Unknown database error"] },
        }
    }
}

export async function deleteCatalogAction(
    companyId: number,
    catalogId: number,
    prevState: CatalogFormState, // For useFormState
    formData: FormData // We don't actually need formData here, but useFormState expects it
): Promise<CatalogFormState> {
    const supabase = await createClient()

    try {
        // Attempt to delete the catalog using the existing function
        await deleteCatalog(supabase, catalogId)

        // Revalidate the main catalogs page/layout after successful deletion
        revalidatePath(`/dashboard/${companyId}/catalogs`)

        // Redirecting might be jarring if deleting from a list. Returning success is better.
        // redirect(`/dashboard/${companyId}/catalogs`);
        return { message: `Catalog successfully deleted.`, type: "success" }

    } catch (error: any) {
        console.error("Database Error:", error)
        // Return specific error if catalog wasn't empty, otherwise generic error
        const errorMessage = error.message.includes("contains products")
            ? error.message
            : "Failed to delete catalog."
        return {
            message: errorMessage,
            type: "error",
            errors: { database: [errorMessage] },
        }
    }
}

export async function updateProductCatalogAction(
    productId: string,
    newCatalogId: number
): Promise<CatalogFormState> {
    const supabase = await createClient()

    try {
        const updatedProduct = await updateProductCatalog(supabase, productId, newCatalogId)

        // Revalidate the catalog pages where the product might appear/disappear
        // This is complex - ideally find the old/new catalog slugs to revalidate precisely.
        // For now, revalidate the base path, which might be less efficient but safer.
        // TODO: Improve revalidation precision if performance becomes an issue.
        const companyId = updatedProduct.company_id; // Assuming company_id is returned
        revalidatePath(`/dashboard/${companyId}/catalogs`, 'layout') // Revalidate the entire layout/subpages

        return { message: `Product catalog updated.`, type: "success" }

    } catch (error: any) {
        console.error("Database Error updating product catalog:", error)
        return {
            message: "Failed to update product catalog.",
            type: "error",
            errors: { database: [error.message || "Unknown database error"] },
        }
    }
}

// Action to add a product to a specific catalog
export async function addProductToCatalogAction(
    productId: string,
    catalogId: number
): Promise<CatalogFormState> {
    const supabase = await createClient();
    try {
        const updatedProduct = await updateProductCatalog(supabase, productId, catalogId);
        const companyId = updatedProduct.company_id; // Assuming company_id is returned
        // Revalidate the layout to update sidebar counts and the specific catalog page
        // TODO: Fetch catalog slug for more precise revalidation?
        revalidatePath(`/dashboard/${companyId}/catalogs`, 'layout');
        return { message: `Product added to catalog.`, type: "success" };
    } catch (error: any) {
        console.error("Database Error adding product to catalog:", error);
        return {
            message: "Failed to add product to catalog.",
            type: "error",
            errors: { database: [error.message || "Unknown database error"] },
        };
    }
}

// Action to remove a product from its current catalog (set catalog_id to null)
export async function removeProductFromCatalogAction(
    productId: string
): Promise<CatalogFormState> {
    const supabase = await createClient();
    try {
        // Use the same update function, but pass null for the catalog ID
        const { data, error } = await supabase
            .from('products')
            .update({ catalog_id: null })
            .eq('id', productId)
            .select('company_id') // Only select company_id for revalidation
            .single();

        if (error) throw error;
        if (!data) throw new Error("Product not found or failed to update.");

        const companyId = data.company_id;
        // Revalidate the layout
        revalidatePath(`/dashboard/${companyId}/catalogs`, 'layout');
        return { message: `Product removed from catalog.`, type: "success" };
    } catch (error: any) {
        console.error("Database Error removing product from catalog:", error);
        return {
            message: "Failed to remove product from catalog.",
            type: "error",
            errors: { database: [error.message || "Unknown database error"] },
        };
    }
} 