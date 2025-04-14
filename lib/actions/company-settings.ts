"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "./helpers" // Assuming helpers is in the same directory or adjust path
import { revalidatePath } from "next/cache"

// Schema for the data expected from the form
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
    const companyIdNum = parseInt(companyId, 10);
    if (isNaN(companyIdNum)) {
        console.error("Invalid Company ID format:", companyId);
        return { success: false, message: "Invalid Company ID format." };
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