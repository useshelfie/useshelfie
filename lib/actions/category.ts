// app/dashboard/categories/actions.ts (or a shared actions file)
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { categorySchema } from "@/schemas/categorySchema"
import { getAuthenticatedUser, handleActionError, type ActionState } from "./helpers"

// Define specific errors and data for this action state
export type CategoryActionStateErrors = { name?: string[]; database?: string[] }
export type CategoryData = { id: number; name: string } // Use number for ID

// Use the generic ActionState
export type CategoryFormState = ActionState<CategoryData | undefined, CategoryActionStateErrors>

// --- Helper to create Supabase client (can be reused within the file)
// const supabase = await createClient(); // Cannot use await at top level
// Instead, create client inside each action or pass it if needed.

// --- Helper: Validate Category Form Data ---
function validateCategoryForm(
  formData: FormData
): { success: true; data: { name: string } } | { success: false; state: CategoryFormState } {
  const rawData = { name: formData.get("name") }
  const validatedFields = categorySchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      state: {
        message: "Validation failed.",
        errors: validatedFields.error.flatten().fieldErrors,
        type: "error",
      },
    }
  }
  return { success: true, data: validatedFields.data }
}

// --- Server Action: Create Category ---
export async function createCategoryAction(
  prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  // 1. Validate Form Data
  const validationResult = validateCategoryForm(formData)
  if (!validationResult.success) return validationResult.state
  const { name } = validationResult.data

  // 2. Extract Company ID
  const companyId = formData.get("companyId")
  if (!companyId || typeof companyId !== "string" || isNaN(parseInt(companyId, 10))) {
    return {
      message: "Valid Company ID is required.",
      type: "error",
      errors: { database: ["Valid Company ID is required."] },
    }
  }
  const companyIdNum = parseInt(companyId, 10)

  // 3. Database Insert
  try {
    const { data: newCategory, error: insertError } = await supabase
      .from("categories")
      .insert({ name: name, user_id: user.id, company_id: companyIdNum })
      .select("id, name")
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique constraint violation
        return {
          message: `Category "${name}" already exists.`,
          errors: { name: [`Category "${name}" already exists.`] },
          type: "error",
        }
      }
      throw insertError // Re-throw other errors to be caught below
    }

    if (!newCategory) {
      throw new Error("Failed to create category or retrieve its data.")
    }

    // 4. Revalidate & Success
    revalidatePath(`/dashboard/${companyIdNum}/categories`)
    revalidatePath(`/dashboard/${companyIdNum}/products/create`) // Revalidate relevant product pages

    return {
      message: `Category "${name}" created successfully!`,
      type: "success",
      data: newCategory,
    }
  } catch (error: any) {
    return handleActionError(error, "Unknown error creating category.")
  }
}

// --- Server Action: Update Category ---
export async function updateCategoryAction(
  categoryId: number,
  companyId: number, // For auth check and revalidation
  prevState: CategoryFormState, // Use the same state type
  formData: FormData
): Promise<CategoryFormState> {
  console.log("--- updateCategoryAction --- ")
  console.log("Received categoryId:", categoryId)
  console.log("Received companyId:", companyId)
  console.log("Received formData name:", formData.get("name"))

  const supabase = await createClient()

  // 1. Validate Form Data
  const validationResult = validateCategoryForm(formData)
  if (!validationResult.success) return validationResult.state
  const { name } = validationResult.data

  // 2. Database Update
  try {
    // Perform the update
    const { data: updatedCategory, error: updateError } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", categoryId)
      .select("id, name") // Select updated data
      .single()

    if (updateError) {
      if (updateError.code === "23505") {
        // Unique constraint violation
        return {
          message: `Category "${name}" already exists.`,
          errors: { name: [`Category "${name}" already exists.`] },
          type: "error",
        }
      }
      throw updateError // Re-throw other errors
    }

    if (!updatedCategory) {
      throw new Error("Failed to update category or retrieve its data.")
    }

    // 3. Revalidate & Success
    revalidatePath(`/dashboard/${companyId}/categories`)
    // Also revalidate product create/edit pages if categories are listed there
    revalidatePath(`/dashboard/${companyId}/products/create`)
    // Consider revalidating individual product pages if they show category names

    return {
      message: `Category "${name}" updated successfully!`,
      type: "success",
      data: updatedCategory,
    }
  } catch (error: any) {
    return handleActionError(error, "Unknown error updating category.")
  }
}

// Delete action might not use useFormState directly, so return type can be simpler
// or use ActionState if feedback is needed on the component calling it.
export type DeleteCategoryState = ActionState<undefined, { database?: string[] }>

export async function deleteCategoryAction(companyId: number, categoryIdString: string): Promise<DeleteCategoryState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryIdString)
      .eq("user_id", user.id)
      .eq("company_id", companyId)

    if (error) {
      if (error.code === "23503") {
        // Foreign key violation
        return {
          message: "Cannot delete category: It is currently assigned to one or more products.",
          errors: { database: ["Category is in use by products."] },
          type: "error",
        }
      }
      throw error // Re-throw other errors
    }

    // Revalidate
    revalidatePath(`/dashboard/${companyId}/categories`)
    revalidatePath(`/dashboard/${companyId}/products/create`)
    revalidatePath(`/dashboard/${companyId}/products`)

    return { message: "Category deleted successfully.", type: "success" }
  } catch (error: any) {
    return handleActionError(error, "Unknown error deleting category.")
  }
}
