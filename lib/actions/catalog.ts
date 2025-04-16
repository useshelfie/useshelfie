"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { catalogFormSchema, type CatalogFormData } from "@/schemas/catalogSchema"
import { createCatalog, updateCatalog, deleteCatalog, updateProductCatalog } from "@/lib/data/catalogs"
// Import helpers
import { getAuthenticatedUser, handleActionError, type ActionState } from "@/lib/data/actions/helpers"
// import type { Catalog } from "@/types/catalog" // Assuming Catalog type exists - Removed as file not found
import type { Product } from "@/types/product" // Assuming Product type exists

// Placeholder Catalog type - Define more accurately if structure is known
type Catalog = { id: number; name: string; slug: string; company_id: number; user_id: string }

// --- Standardized Action State Types ---

// Specific errors for catalog form actions
export type CatalogActionErrors = { name?: string[]; database?: string[] }
// Data type for catalog form actions (e.g., returning updated/created catalog)
export type CatalogActionData = Pick<Catalog, "id" | "name" | "slug"> | undefined
// Generic state for catalog form actions (create, update, delete)
export type CatalogFormState = ActionState<CatalogActionData, CatalogActionErrors>

// Specific state for actions modifying product-catalog relationship
export type ProductCatalogActionState = ActionState<
  Pick<Product, "id" | "company_id"> | undefined,
  { database?: string[] }
>

// --- Helper Functions (Internal) ---

// Wrapper for schema validation
function validateCatalogForm(
  formData: FormData
): { success: true; data: CatalogFormData } | { success: false; state: CatalogFormState } {
  const validatedFields = catalogFormSchema.safeParse({
    name: formData.get("name"),
  })
  if (!validatedFields.success) {
    return {
      success: false,
      state: {
        message: "Invalid form data.",
        type: "error",
        errors: validatedFields.error.flatten().fieldErrors,
      },
    }
  }
  return { success: true, data: validatedFields.data }
}

// --- Server Actions ---

export async function createCatalogAction(
  companyId: number,
  prevState: CatalogFormState, // For useActionState
  formData: FormData
): Promise<CatalogFormState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  const validationResult = validateCatalogForm(formData)
  if (!validationResult.success) return validationResult.state

  const { name } = validationResult.data

  try {
    const newCatalog = await createCatalog(supabase, companyId, user.id, name)
    revalidatePath(`/dashboard/${companyId}/catalogs`)
    // Redirect throws an error, so state below is not typically reached.
    // Catching the redirect error is possible but often not necessary.
    redirect(`/dashboard/${companyId}/catalogs/${newCatalog.slug}`)
  } catch (error: unknown) {
    // Handle potential redirect error or database error
    if ((error as Error).message === "NEXT_REDIRECT") {
      throw error // Re-throw redirect errors
    }
    return handleActionError(error as Error, "Failed to create catalog.")
  }
}

export async function updateCatalogAction(
  companyId: number,
  catalogId: number,
  prevState: CatalogFormState,
  formData: FormData
): Promise<CatalogFormState> {
  const supabase = await createClient()
  // Ensure user is authenticated and owns the company/catalog (implicit via RLS in updateCatalog helper)
  await getAuthenticatedUser(supabase)

  const validationResult = validateCatalogForm(formData)
  if (!validationResult.success) return validationResult.state

  const { name } = validationResult.data

  try {
    // Assume updateCatalog function handles RLS/authorization checks internally
    const updatedCatalog = await updateCatalog(supabase, catalogId, name)

    revalidatePath(`/dashboard/${companyId}/catalogs`)
    revalidatePath(`/dashboard/${companyId}/catalogs/${updatedCatalog.slug}`)
    revalidatePath(`/dashboard/${companyId}/catalogs/${updatedCatalog.slug}/edit`)

    return {
      message: `Catalog '${updatedCatalog.name}' updated.`,
      type: "success",
      data: updatedCatalog, // Return updated data
    }
  } catch (error: unknown) {
    return handleActionError(error as Error, "Failed to update catalog.")
  }
}

export async function deleteCatalogAction(
  companyId: number,
  catalogId: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prevState: CatalogFormState, // For useFormState
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formData: FormData // Unused but expected by useFormState
): Promise<CatalogFormState> {
  const supabase = await createClient()
  // Ensure user is authenticated and owns the company/catalog
  await getAuthenticatedUser(supabase)

  try {
    // Assume deleteCatalog function handles RLS/authorization checks and potential FK constraints
    await deleteCatalog(supabase, catalogId)

    revalidatePath(`/dashboard/${companyId}/catalogs`)

    return { message: `Catalog successfully deleted.`, type: "success" }
  } catch (error: unknown) {
    // Use shared handler, customize message slightly if needed
    const errorCode = (error as { code?: string }).code
    const errorMessage = (error as Error).message
    if (errorCode === "23503" || (errorMessage && errorMessage.includes("violates foreign key constraint"))) {
      return handleActionError(error as Error, "Cannot delete catalog: It still contains products.")
    }
    return handleActionError(error as Error, "Failed to delete catalog.")
  }
}

// --- Product <-> Catalog Relationship Actions ---

export async function updateProductCatalogAction(
  productId: string,
  newCatalogId: number | null // Allow null for removal
): Promise<ProductCatalogActionState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase) // Ensure auth

  let oldCatalogId: number | null = null
  let companyId: number | null = null // Ensure companyId is accessible

  try {
    // 1. Fetch current product state (including old catalog ID and company ID)
    const { data: currentProduct, error: fetchError } = await supabase
      .from("products")
      .select("id, company_id, catalog_id")
      .eq("id", productId)
      .eq("user_id", user.id) // Ensure ownership
      .single()

    if (fetchError) throw new Error("Failed to fetch current product state.")
    if (!currentProduct) throw new Error("Product not found or you do not have permission.")

    oldCatalogId = currentProduct.catalog_id
    companyId = currentProduct.company_id // Store companyId for revalidation

    if (!companyId) throw new Error("Company ID not found.")

    // Optimization: If catalog isn't changing, skip update and revalidation
    if (oldCatalogId === newCatalogId) {
      return {
        message: "Product is already in the target catalog.",
        type: "success",
        data: { id: productId, company_id: companyId },
      }
    }

    // 2. Perform the update
    let updatedProductData: { id: string; company_id: number | string | null } // Loosen type here to handle potential string return

    if (newCatalogId === null) {
      // Handle removal directly
      const { data, error } = await supabase
        .from("products")
        .update({ catalog_id: null })
        .eq("id", productId)
        .select("id, company_id")
        // Request specific types, but prepare for potential string
        .single<{ id: string; company_id: number | string | null }>()

      if (error) throw error
      if (!data) throw new Error("Failed to update product (removing catalog).")
      updatedProductData = data
    } else {
      // Explicitly cast newCatalogId due to persistent linter issue
      const result = await updateProductCatalog(supabase, productId, newCatalogId as number)
      // Assume result might have string or number for company_id despite Product type
      updatedProductData = result as unknown as { id: string; company_id: number | string | null } // Cast to handle potential mismatch from helper
    }

    // Explicitly parse the company_id from the update result
    let parsedCompanyIdFromUpdate: number | null = null
    if (updatedProductData.company_id !== null && updatedProductData.company_id !== undefined) {
      const idAsNumber = parseInt(String(updatedProductData.company_id), 10)
      if (!isNaN(idAsNumber)) {
        parsedCompanyIdFromUpdate = idAsNumber
      }
    }

    // Use the parsed ID from update if valid, otherwise fallback to the initially fetched one
    companyId = parsedCompanyIdFromUpdate ?? companyId

    // Stricter check for companyId before revalidation
    if (typeof companyId !== "number") {
      console.error("Critical: Could not determine a valid company ID for revalidation after product catalog update.", {
        initial: currentProduct?.company_id,
        fromUpdate: updatedProductData?.company_id,
      })
      throw new Error("Failed to determine company ID after update.")
    }
    // companyId is guaranteed number here
    const finalCompanyId = companyId

    // 3. Fetch slugs for revalidation
    const catalogIdsToFetch = [oldCatalogId, newCatalogId].filter((id): id is number => id !== null)
    const slugs: { [key: number]: string } = {}
    if (catalogIdsToFetch.length > 0) {
      const { data: catalogData, error: slugError } = await supabase
        .from("catalogs")
        .select("id, slug")
        .in("id", catalogIdsToFetch)

      if (slugError) {
        console.error("Failed to fetch catalog slugs for revalidation:", slugError)
      } else if (catalogData) {
        catalogData.forEach((c) => {
          slugs[c.id] = c.slug
        })
      }
    }

    // 4. Precise Revalidation (using finalCompanyId which is number)
    revalidatePath(`/dashboard/${finalCompanyId}/catalogs`)
    if (oldCatalogId && slugs[oldCatalogId]) {
      revalidatePath(`/dashboard/${finalCompanyId}/catalogs/${slugs[oldCatalogId]}`)
    }
    if (newCatalogId && slugs[newCatalogId]) {
      revalidatePath(`/dashboard/${finalCompanyId}/catalogs/${slugs[newCatalogId]}`)
    }

    // 5. Return Success
    return {
      message: `Product catalog updated successfully.`,
      type: "success",
      data: { id: updatedProductData.id, company_id: finalCompanyId },
    }
  } catch (error: unknown) {
    // Ensure companyId is passed if available for error state
    const errorState = handleActionError(
      error as Error,
      "Failed to update product catalog."
    ) as ProductCatalogActionState
    // Optionally add companyId to error state if needed for UI feedback
    // errorState.data = { id: productId, company_id: companyId };
    return errorState
  }
}

// Add Product to Catalog (wrapper around updateProductCatalogAction)
export async function addProductToCatalogAction(
  productId: string,
  catalogId: number
): Promise<ProductCatalogActionState> {
  // Simple wrapper, relies on updateProductCatalogAction for logic and auth
  return updateProductCatalogAction(productId, catalogId)
}

// Remove Product from Catalog (wrapper around updateProductCatalogAction)
export async function removeProductFromCatalogAction(productId: string): Promise<ProductCatalogActionState> {
  // Simple wrapper, relies on updateProductCatalogAction for logic and auth
  // updateProductCatalogAction already handles the null case correctly.
  return updateProductCatalogAction(productId, null)
}
