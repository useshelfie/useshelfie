"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, handleActionError, type ActionState } from "@/lib/data/actions/helpers"
import { z } from "zod"

// --- State Types ---
// Placeholder: Define actual company data type if needed
type CompanyData = { id: number; name: string } | undefined
export type CompanyActionErrors = { name?: string[]; three_words?: string[]; database?: string[] }
export type CompanyFormState = ActionState<CompanyData, CompanyActionErrors>
export type DeleteCompanyState = ActionState<undefined, { database?: string[] }>

// --- Schema (Example) ---
// Define based on updatable fields from your companies table
const companyUpdateSchema = z.object({
  name: z.string().min(1, "Company name cannot be empty."),
  // Add other updatable fields like three_words if applicable
  // three_words: z.string().optional(),
})

// --- Server Action: Update Company ---
export async function updateCompanyAction(
  companyId: number,
  prevState: CompanyFormState,
  formData: FormData
): Promise<CompanyFormState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  // 1. Validate Form Data
  const validatedFields = companyUpdateSchema.safeParse({
    name: formData.get("name"),
    // Parse other fields
  })

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
      type: "error",
    }
  }
  const { name /*, other fields */ } = validatedFields.data

  // 2. Database Update
  try {
    // Verify ownership: Check if user.id matches companies.owner_id for companyId
    const { data: ownerData, error: ownerCheckError } = await supabase
      .from("companies")
      .select("owner_id")
      .eq("id", companyId)
      .single()

    if (ownerCheckError) throw new Error("Failed to verify company ownership.")
    if (!ownerData) throw new Error("Company not found.")
    if (ownerData.owner_id !== user.id) {
      return handleActionError(
        { name: "PermissionError", message: "You do not have permission to update this company." },
        "You do not have permission to update this company."
      )
    }

    // Perform the update - TODO: Implement actual Supabase update call
    // const { data: updatedCompany, error: updateError } = await supabase
    //     .from("companies")
    //     .update({ name /*, other fields */ })
    //     .eq("id", companyId)
    //     .select("id, name") // Select needed fields
    //     .single();

    // if (updateError) throw updateError;
    // if (!updatedCompany) throw new Error("Failed to update company.");

    // TODO: Replace with actual data once update is implemented
    const updatedCompany = { id: companyId, name: name }

    console.log("Placeholder: Company update logic needed here.")

    // 3. Revalidate Paths (Adjust as needed)
    revalidatePath(`/dashboard/${companyId}`)
    revalidatePath(`/dashboard/company/settings`) // Example settings page
    revalidatePath(`/`) // If company name shown in global nav?

    return {
      message: `Company "${name}" updated successfully! (Placeholder)`, // Update message
      type: "success",
      data: updatedCompany, // Return updated data
    }
  } catch (error: unknown) {
    // Handle specific errors like unique name violation if needed
    return handleActionError(error as Error, "Unknown error updating company.")
  }
}

// --- Server Action: Delete Company ---
export async function deleteCompanyAction(companyId: number): Promise<DeleteCompanyState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  try {
    // 1. Verify Ownership
    const { data: ownerData, error: ownerCheckError } = await supabase
      .from("companies")
      .select("owner_id")
      .eq("id", companyId)
      .single()

    if (ownerCheckError) throw new Error("Failed to verify company ownership.")
    if (!ownerData) throw new Error("Company not found.")
    if (ownerData.owner_id !== user.id) {
      return handleActionError(
        { name: "PermissionError", message: "You do not have permission to delete this company." },
        "You do not have permission to delete this company."
      )
    }

    // 2. Check for Dependencies (Catalogs, Products, Categories)
    // TODO: Implement checks - e.g., count related items
    // If dependencies exist, return error state preventing deletion
    // Example check:
    // const { count, error } = await supabase.from('products').select('id', { count: 'exact' }).eq('company_id', companyId);
    // if (count > 0) return handleActionError({}, "Cannot delete company: It has associated products.");

    console.warn("Placeholder: Dependency checks before company deletion needed here.")

    // 3. Perform Deletion
    // TODO: Implement actual Supabase delete call
    // const { error: deleteError } = await supabase.from("companies").delete().eq("id", companyId);
    // if (deleteError) throw deleteError;

    console.log("Placeholder: Company delete logic needed here.")

    // 4. Revalidate Paths (Redirect happens client-side usually after delete)
    revalidatePath(`/dashboard`) // User likely redirected away from the deleted company dashboard

    return { message: "Company deleted successfully! (Placeholder)", type: "success" } // Update message
  } catch (error: unknown) {
    return handleActionError(error as Error, "Failed to delete company.")
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const settingsFormSchema = z.object({
  name: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  word1: z.string().min(1, { message: "Word 1 is required." }),
  word2: z.string().min(1, { message: "Word 2 is required." }),
  word3: z.string().min(1, { message: "Word 3 is required." }),
})

type SettingsFormData = z.infer<typeof settingsFormSchema>

export async function updateCompanySettings(
  companyId: string,
  formData: SettingsFormData
): Promise<{ success: boolean; message: string }> {
  // 1. Authentication & Authorization
  let user
  try {
    user = await getAuthenticatedUser()
  } catch (error) {
    // getAuthenticatedUser redirects on error, but we catch just in case
    console.error("Authentication failed in updateCompanySettings:", error)
    return { success: false, message: "Authentication required. Please log in again." }
  }

  // Convert companyId from string to number for database query, handle potential errors
  const companyIdNum = parseInt(companyId, 10)
  if (isNaN(companyIdNum)) {
    console.error("Invalid Company ID format:", companyId)
    return { success: false, message: "Invalid Company ID format." }
  }

  const supabase = await createClient()

  // Verify ownership
  const { data: companyOwnerCheck, error: ownerCheckError } = await supabase
    .from("companies")
    .select("owner_id")
    .eq("id", companyIdNum)
    .single()

  if (ownerCheckError || !companyOwnerCheck) {
    console.error(`Error checking ownership or company not found for ID ${companyIdNum}:`, ownerCheckError)
    return { success: false, message: "Company not found or access denied." }
  }

  if (companyOwnerCheck.owner_id !== user.id) {
    console.warn(`Unauthorized attempt by user ${user.id} to update settings for company ${companyIdNum}`)
    return { success: false, message: "You do not have permission to update this company." }
  }

  // 2. Validation (Data comes pre-validated by Zod in the form, but we trust the form values here)
  // Re-validating on the server is a good practice for security, but for simplicity, we trust the form's validation for now.
  // const validation = settingsFormSchema.safeParse(formData);
  // if (!validation.success) {
  //     return { success: false, message: validation.error.errors[0]?.message || "Invalid data.", data: null };
  // }

  // 3. Database Update
  try {
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        name: formData.name,
        three_words: [formData.word1, formData.word2, formData.word3],
      })
      .eq("id", companyIdNum)
      .eq("owner_id", user.id) // Ensure we only update if owner matches (extra safety)

    if (updateError) {
      console.error(`Error updating company ${companyIdNum}:`, updateError)
      return { success: false, message: `Failed to update company settings: ${updateError.message}` }
    }

    // 4. Revalidation (Optional but recommended)
    // Revalidate the settings page path to show updated data
    revalidatePath(`/dashboard/${companyId}/settings`)
    // Optionally revalidate other paths if the company name/words are displayed elsewhere
    // revalidatePath(`/dashboard/${companyId}`)
    // revalidatePath(`/dashboard`)

    console.log(`Company settings updated successfully for company ${companyIdNum}`)
    return { success: true, message: "Company settings updated successfully!" }
  } catch (error) {
    console.error("Unexpected error during company settings update:", error)
    return { success: false, message: "An unexpected error occurred. Please try again." }
  }
}
