"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, handleActionError, type ActionState } from "@/lib/actions/helpers"
import { z } from "zod"

// --- State Types ---
// Placeholder: Define actual company data type if needed
type CompanyData = { id: number; name: string; } | undefined;
export type CompanyActionErrors = { name?: string[]; three_words?: string[]; database?: string[] }
export type CompanyFormState = ActionState<CompanyData, CompanyActionErrors>
export type DeleteCompanyState = ActionState<undefined, { database?: string[] }>;

// --- Schema (Example) ---
// Define based on updatable fields from your companies table
const companyUpdateSchema = z.object({
    name: z.string().min(1, "Company name cannot be empty."),
    // Add other updatable fields like three_words if applicable
    // three_words: z.string().optional(), 
});

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
    });

    if (!validatedFields.success) {
        return {
            message: "Validation failed.",
            errors: validatedFields.error.flatten().fieldErrors,
            type: "error",
        }
    }
    const { name /*, other fields */ } = validatedFields.data;

    // 2. Database Update
    try {
        // Verify ownership: Check if user.id matches companies.owner_id for companyId
        const { data: ownerData, error: ownerCheckError } = await supabase
            .from('companies')
            .select('owner_id')
            .eq('id', companyId)
            .single();

        if (ownerCheckError) throw new Error("Failed to verify company ownership.");
        if (!ownerData) throw new Error("Company not found.");
        if (ownerData.owner_id !== user.id) {
            return handleActionError({}, "You do not have permission to update this company.");
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
        const updatedCompany = { id: companyId, name: name };

        console.log("Placeholder: Company update logic needed here.")

        // 3. Revalidate Paths (Adjust as needed)
        revalidatePath(`/dashboard/${companyId}`)
        revalidatePath(`/dashboard/company/settings`) // Example settings page
        revalidatePath(`/`) // If company name shown in global nav?

        return {
            message: `Company "${name}" updated successfully! (Placeholder)`, // Update message
            type: "success",
            data: updatedCompany // Return updated data
        }
    } catch (error: any) {
        // Handle specific errors like unique name violation if needed
        return handleActionError(error, "Unknown error updating company.");
    }
}

// --- Server Action: Delete Company ---
export async function deleteCompanyAction(
    companyId: number,
): Promise<DeleteCompanyState> {
    const supabase = await createClient()
    const user = await getAuthenticatedUser(supabase)

    try {
        // 1. Verify Ownership
        const { data: ownerData, error: ownerCheckError } = await supabase
            .from('companies')
            .select('owner_id')
            .eq('id', companyId)
            .single();

        if (ownerCheckError) throw new Error("Failed to verify company ownership.");
        if (!ownerData) throw new Error("Company not found.");
        if (ownerData.owner_id !== user.id) {
            return handleActionError({}, "You do not have permission to delete this company.");
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

        return { message: "Company deleted successfully! (Placeholder)", type: "success" }; // Update message

    } catch (error: any) {
        return handleActionError(error, "Failed to delete company.");
    }
} 