// app/dashboard/products/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { productSchema } from "@/schemas/productSchema"

export type CreateProductFormState = {
  message: string
  errors?: {
    name?: string[]
    description?: string[]
    price?: string[]
    categories?: string[]
    image_urls?: string[]
    database?: string[]
  }
  type: "error" | "success" | null
}

export async function createProductAction(
  prevState: CreateProductFormState,
  formData: FormData
): Promise<CreateProductFormState> {
  const supabase = await createClient()

  // 1. Get User
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  // 2. Extract Base Product Data & Image URLs
  const rawProductData = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    image_urls: formData.getAll("image_urls").filter((url) => typeof url === "string" && url.length > 0) as string[],
  }

  // Extract companyId from read-only field
  const companyId = formData.get("companyId")
  if (!companyId || typeof companyId !== "string") {
    return {
      message: "Missing or invalid Company ID.",
      type: "error",
    }
  }
  console.log("Company ID in action:", companyId)

  // 3. Validate Base Product Data (including image URLs)
  const validatedProductFields = productSchema.safeParse(rawProductData)
  if (!validatedProductFields.success) {
    console.error("Product Validation Errors:", validatedProductFields.error.flatten().fieldErrors)
    return {
      message: "Product validation failed.",
      errors: validatedProductFields.error.flatten().fieldErrors,
      type: "error",
    }
  }

  // 4. Extract Category IDs
  // Assuming category IDs are submitted as 'category_ids[]' or similar from multi-select
  const categoryIds = formData
    .getAll("category_ids")
    .filter((id) => typeof id === "string" && id.length > 0) as string[]
  // Basic validation: Check if they look like UUIDs (simple check)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  const invalidCategoryIds = categoryIds.filter((id) => !uuidRegex.test(id))
  if (invalidCategoryIds.length > 0) {
    return {
      message: "Invalid category format submitted.",
      errors: { categories: ["Invalid category ID format."] },
      type: "error",
    }
  }

  // === Transaction for Atomicity (Optional but Recommended) ===
  // Supabase Edge Functions or database functions (pg_net) are better for true transactions.
  // Doing it sequentially in a Server Action is simpler but not truly atomic.
  // If the category linking fails after product creation, the product will exist without categories.

  // 5. Insert Product (with image_urls)
  const { data: newProduct, error: productInsertError } = await supabase
    .from("products")
    .insert({
      ...validatedProductFields.data,
      user_id: user.id,
      company_id: companyId,
    })
    .select("id")
    .single()

  if (productInsertError || !newProduct) {
    console.error("Supabase Product Insert Error:", productInsertError)
    return {
      message: `Database error creating product: ${productInsertError?.message ?? "Unknown error"}`,
      errors: {
        database: [productInsertError?.message ?? "Failed to create product."],
      },
      type: "error",
    }
  }

  const newProductId = newProduct.id

  // 6. Link Categories (if any were selected)
  if (categoryIds.length > 0) {
    // Optional: Verify selected categories belong to the user before linking
    const { data: validCategories, error: categoryCheckError } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .in("id", categoryIds)

    if (categoryCheckError || !validCategories) {
      // Could rollback product creation here if using a transaction, otherwise just report error
      console.error("Error verifying categories:", categoryCheckError)
      return {
        message: "Error verifying selected categories.",
        errors: {
          categories: ["Could not verify selected categories."],
        },
        type: "error",
      }
    }

    const validCategoryIds = validCategories.map((c) => c.id)
    const categoriesToLink = categoryIds
      .filter((id) => validCategoryIds.includes(id)) // Only link valid, owned categories
      .map((catId) => ({
        product_id: newProductId,
        category_id: catId,
      }))

    if (categoriesToLink.length > 0) {
      const { error: linkError } = await supabase.from("product_categories").insert(categoriesToLink)

      if (linkError) {
        // Again, rollback would be ideal in a transaction
        console.error("Supabase Category Link Error:", linkError)
        // Clean up the newly created product? Or leave it and report error?
        // await supabase.from('products').delete().eq('id', newProductId); // Example cleanup
        return {
          message: `Product created, but failed to link categories: ${linkError.message}`,
          // Keep success minimal, but indicate partial failure
          errors: {
            database: [`Failed to link categories: ${linkError.message}`],
          },
          type: "error", // Treat partial failure as error for user feedback
        }
      }
    } else if (categoryIds.length > 0) {
      // User selected categories, but none were valid/owned by them
      return {
        message: "Selected categories are not valid or do not belong to you.",
        errors: { categories: ["Invalid categories selected."] },
        type: "error",
      }
    }
  }

  // 7. Success
  console.log("Product created successfully:", validatedProductFields.data.name)
  revalidatePath(`/dashboard/${companyId}/products`) // Revalidate product list page
  // Don't redirect here, let the form handle success state

  return {
    message: `Product "${validatedProductFields.data.name}" created successfully!`,
    type: "success",
  }
}
