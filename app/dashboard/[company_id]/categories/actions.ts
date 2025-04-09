// app/dashboard/categories/actions.ts (or a shared actions file)
"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { categorySchema } from "@/schemas/categorySchema"

export type CreateCategoryFormState = {
  message: string
  errors?: { name?: string[]; database?: string[] }
  type: "error" | "success" | null
  newCategory?: { id: string; name: string } // Optionally return the created category
}

export async function createCategoryAction(
  prevState: CreateCategoryFormState,
  formData: FormData
): Promise<CreateCategoryFormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { message: "Authentication required.", type: "error" }
  }

  const rawFormData = { name: formData.get("name") }
  const companyId = formData.get("companyId")
  const validatedFields = categorySchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
      type: "error",
    }
  }

  if (!companyId) {
    return {
      message: "Company ID is required.",
      errors: {},
      type: "error",
    }
  }

  const { name } = validatedFields.data

  const { data: newCategory, error: insertError } = await supabase
    .from("categories")
    .insert({ name: name, user_id: user.id, company_id: companyId })
    .select("id, name") // Select the newly created category data
    .single() // Expect only one row back

  if (insertError) {
    // Handle specific errors like unique constraint violation (duplicate name)
    if (insertError.code === "23505") {
      // PostgreSQL unique violation code
      return {
        message: `Category "${name}" already exists.`,
        errors: { name: [`Category "${name}" already exists.`] },
        type: "error",
      }
    }
    console.error("Supabase Category Insert Error:", insertError)
    return {
      message: `Database error: ${insertError.message}`,
      errors: { database: [insertError.message] },
      type: "error",
    }
  }

  // Revalidate paths where categories might be displayed or used
  revalidatePath(`/dashboard/${companyId}/categories`)
  revalidatePath(`/dashboard/${companyId}/products/create`) // Revalidate product form if it lists categories

  return {
    message: `Category "${name}" created successfully!`,
    type: "success",
    newCategory: newCategory ?? undefined, // Pass back the created category data
  }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("categories").delete().eq("id", categoryId)

  if (error) throw new Error(error.message)
}
