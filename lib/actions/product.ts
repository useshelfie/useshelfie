"use server"

import { revalidatePath } from "next/cache"
// import { redirect } from "next/navigation" // No longer needed here
import { createClient } from "@/lib/supabase/server"
import { productSchema } from "@/schemas/productSchema"
import type { Product } from "@/types/product"
import { getAuthenticatedUser, handleActionError, type ActionState } from "./helpers" // Import helpers
import { SupabaseClient } from "@supabase/supabase-js" // Import SupabaseClient type
import { v4 as uuidv4 } from "uuid" // For generating unique names

// Define specific errors for this action state, extending the generic ActionState
export type ProductActionStateErrors = {
  name?: string[]
  description?: string[]
  price?: string[]
  categories?: string[]
  image_links?: string[]
  database?: string[]
}

// Use the generic ActionState, providing specific error and data types
export type ProductFormState = ActionState<Pick<Product, "id"> | undefined, ProductActionStateErrors>

export type DeleteProductState = ActionState<undefined, { database?: string[] }>

// --- Helper: Upload Images to Supabase Storage (Server-Side) ---
async function uploadImagesToServer(
  supabase: SupabaseClient,
  files: File[],
  companyId: string,
  bucketName: string = "product-images"
): Promise<{ uploadedUrls: string[]; errors: { name: string; message: string }[] }> {
  const uploadedUrls: string[] = []
  const errors: { name: string; message: string }[] = []

  if (!companyId) {
    console.error("Cannot upload images without companyId")
    return { uploadedUrls, errors: [{ name: "general", message: "Company ID is missing." }] }
  }

  await Promise.all(
    files.map(async (file) => {
      const uniqueFileName = `${uuidv4()}-${file.name.replace(/\s+/g, "_")}`
      const filePath = `${companyId}/products/${uniqueFileName}` // Organize by company/products

      try {
        const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

        if (uploadError) {
          throw uploadError
        }

        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)
        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl)
        } else {
          throw new Error("Failed to get public URL after upload.")
        }
      } catch (error: unknown) {
        console.error(`Failed to upload ${file.name}:`, error)
        const errorMessage = error instanceof Error ? error.message : "Upload failed."
        errors.push({ name: file.name, message: errorMessage })
      }
    })
  )

  return { uploadedUrls, errors }
}

// --- Helper: Delete Images from Supabase Storage (Server-Side) ---
async function deleteImagesFromServer(
  supabase: SupabaseClient,
  urlsToDelete: string[],
  bucketName: string = "product-images"
): Promise<{ errors: { url: string; message: string }[] }> {
  const errors: { url: string; message: string }[] = []
  if (urlsToDelete.length === 0) {
    return { errors }
  }

  // Extract paths from URLs
  const pathsToDelete = urlsToDelete
    .map((url) => {
      try {
        const urlParts = new URL(url)
        // Assumes URL format like: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
        // Adjust the split index based on your actual URL structure
        const path = urlParts.pathname.split(`/${bucketName}/`)[1]
        if (!path) throw new Error("Could not extract path from URL")
        return path
      } catch (e: unknown) {
        console.error(`Error parsing URL or extracting path from ${url}: ${e}`)
        const errorMessage = e instanceof Error ? e.message : "Unknown error parsing URL"
        errors.push({ url, message: `Invalid URL format or path extraction failed: ${errorMessage}` })
        return null // Mark as invalid
      }
    })
    .filter((path): path is string => path !== null) // Filter out invalid paths

  if (pathsToDelete.length > 0) {
    console.log("Attempting to delete paths:", pathsToDelete)
    const { data, error: deleteError } = await supabase.storage.from(bucketName).remove(pathsToDelete)

    if (deleteError) {
      console.error("Error deleting files from storage:", deleteError)
      // Add a general error, or try to map specific file errors if the API provides them
      errors.push({ url: "multiple", message: `Storage deletion failed: ${deleteError.message}` })
    } else {
      console.log("Successfully deleted paths:", data)
    }
  }

  return { errors }
}

// --- Helper: Validate Product Form Data (excluding image_links) ---
function validateProductForm(formData: FormData):
  | {
      success: true
      data: Omit<Product, "id" | "user_id" | "company_id" | "created_at" | "catalog_id" | "image_links">
    }
  | { success: false; state: Omit<ProductFormState, "data"> } {
  // Exclude data field on error state
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    // image_links are no longer validated here, they come from server upload
  }

  // Use a partial schema for validation, excluding image_links
  const partialProductSchema = productSchema.omit({ image_links: true })
  const validatedFields = partialProductSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error("Product Validation Errors (excluding images):", validatedFields.error.flatten().fieldErrors)
    return {
      success: false,
      state: {
        message: "Product validation failed.",
        errors: validatedFields.error.flatten().fieldErrors as ProductActionStateErrors, // Cast to specific error type
        type: "error",
      },
    }
  }
  // Type assertion needed as schema includes fields not directly from form here
  return { success: true, data: validatedFields.data }
}

// --- Placeholder Storage Actions (Remove if not used, or implement) ---

// Comment out unused placeholder functions
/*
async function uploadProductImage(supabase: SupabaseClient, file: File, productId: string): Promise<string> {
  // ... implementation ...
}
*/

async function deleteProductImage(supabase: SupabaseClient, imageUrl: string): Promise<void> {
  // TODO: Implement actual Supabase Storage delete logic
  // 1. Extract the file path from the imageUrl (this depends on your URL structure and bucket settings)
  //    Example: If URL is https://<project>.supabase.co/storage/v1/object/public/product-images/path/to/image.jpg
  //    The path is likely 'path/to/image.jpg'
  // 2. Use `supabase.storage.from('product-images').remove([filePath])`
  // 3. Handle errors
  console.log(`Placeholder: Deleting image ${imageUrl}`)
  // Extract the file path from the imageUrl
  let filePath = ""
  try {
    const url = new URL(imageUrl)
    // Example: Adjust based on your URL structure
    const pathParts = url.pathname.split("/product-images/")
    if (pathParts.length > 1) {
      filePath = pathParts[1]
    }
  } catch (e) {
    console.error(`Invalid image URL format: ${imageUrl}`, e)
    // Decide how to handle: throw error, return, log?
    return // Don't attempt deletion if URL is invalid
  }

  if (!filePath) {
    console.error(`Could not extract file path from URL: ${imageUrl}`)
    return
  }

  console.log(`Attempting to delete storage object at path: ${filePath}`)
  const { error } = await supabase.storage.from("product-images").remove([filePath])

  if (error) {
    console.error(`Failed to delete image from storage (${filePath}):`, error)
    // Decide how to handle: throw error, return, log?
    // Consider not throwing here during product delete to avoid blocking it
  }
}

// --- Server Action: Create Product ---
export async function createProductAction(prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  // 1. Validate Base Product Data (excluding images)
  const validationResult = validateProductForm(formData)
  if (!validationResult.success) return validationResult.state
  const productData = validationResult.data

  // 2. Extract Company ID
  const companyId = formData.get("companyId")
  if (!companyId || typeof companyId !== "string") {
    return {
      message: "Missing or invalid Company ID.",
      type: "error",
      errors: { database: ["Missing or invalid Company ID."] },
    }
  }
  const companyIdNum = parseInt(companyId, 10)
  if (isNaN(companyIdNum)) {
    return {
      message: "Invalid Company ID format.",
      type: "error",
      errors: { database: ["Invalid Company ID format."] },
    }
  }

  // 3. Extract and Validate Category IDs
  const categoryIds = formData
    .getAll("category_ids")
    .filter((id): id is string => typeof id === "string" && id.length > 0)

  // 4. Extract Image Files
  const imageFiles = formData.getAll("new_images").filter((file): file is File => file instanceof File && file.size > 0)
  const MAX_IMAGES = 5 // Define max images allowed
  if (imageFiles.length > MAX_IMAGES) {
    return {
      message: `Too many images selected. Maximum allowed is ${MAX_IMAGES}.`,
      type: "error",
      errors: { image_links: [`Maximum ${MAX_IMAGES} images allowed.`] },
    }
  }

  // --- Database Operations ---
  try {
    // 5. Upload Images (if any)
    let uploadedImageUrls: string[] = []
    if (imageFiles.length > 0) {
      const uploadResult = await uploadImagesToServer(supabase, imageFiles, companyId)
      if (uploadResult.errors.length > 0) {
        // Handle upload errors - return state with image-specific errors
        const errorMessages = uploadResult.errors.map((e) => `${e.name}: ${e.message}`)
        return {
          message: "Some images failed to upload.",
          type: "error",
          errors: { image_links: errorMessages },
        }
      }
      uploadedImageUrls = uploadResult.uploadedUrls
    }

    // 6. Insert Product with Uploaded Image URLs
    const { data: newProduct, error: productInsertError } = await supabase
      .from("products")
      .insert({
        ...productData,
        user_id: user.id,
        company_id: companyIdNum,
        image_links: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined, // Add the uploaded URLs
      })
      .select("id")
      .single()

    if (productInsertError) throw productInsertError
    if (!newProduct) throw new Error("Failed to create product or retrieve ID.")
    const newProductId = newProduct.id

    // 7. Link Categories (if any, using string UUIDs)
    if (categoryIds.length > 0) {
      const { data: validCategories, error: categoryCheckError } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", companyIdNum)
        .in("id", categoryIds) // Use original string IDs

      if (categoryCheckError) {
        console.error("Error verifying categories:", categoryCheckError)
        return {
          message: `Product created (ID: ${newProductId}), but failed to verify categories: ${categoryCheckError.message}`,
          type: "error",
          errors: { database: [`Failed to verify categories: ${categoryCheckError.message}`] },
        }
      }

      const validCategoryIds = validCategories?.map((c) => String(c.id)) ?? [] // Ensure IDs are strings for comparison
      const categoriesToLink = categoryIds
        .filter((id) => validCategoryIds.includes(id))
        .map((catId) => ({ product_id: newProductId, category_id: catId })) // Use original string ID

      if (categoriesToLink.length !== categoryIds.length) {
        console.warn("Some selected categories were invalid or not owned by the user.")
      }

      if (categoriesToLink.length > 0) {
        const { error: linkError } = await supabase.from("product_categories").insert(categoriesToLink)
        if (linkError) {
          console.error("Supabase Category Link Error:", linkError)
          return {
            message: `Product created (ID: ${newProductId}), but failed to link categories: ${linkError.message}`,
            type: "error",
            errors: { database: [`Failed to link categories: ${linkError.message}`] },
          }
        }
      }
    }

    // 8. Success
    revalidatePath(`/dashboard/${companyIdNum}/products`)

    return {
      message: `Product "${productData.name}" created successfully!`,
      type: "success",
      data: { id: newProductId },
    }
  } catch (error: unknown) {
    return handleActionError(error as Error, "Failed to create product due to a database or storage error.")
  }
}

// --- Server Action: Update Product ---
export async function updateProductAction(
  productId: string,
  prevState: ProductFormState, // Use the same state type for consistency
  formData: FormData
): Promise<ProductFormState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  // 1. Validate Base Product Data (excluding images)
  const validationResult = validateProductForm(formData)
  if (!validationResult.success) return validationResult.state
  const productData = validationResult.data

  // 2. Extract Company ID (Unchanged)
  const companyId = formData.get("companyId")
  if (!companyId || typeof companyId !== "string") {
    return {
      message: "Missing or invalid Company ID.",
      type: "error",
      errors: { database: ["Missing or invalid Company ID."] },
    }
  }
  const companyIdNum = parseInt(companyId, 10)
  if (isNaN(companyIdNum)) {
    return {
      message: "Invalid Company ID format.",
      type: "error",
      errors: { database: ["Invalid Company ID format."] },
    }
  }

  // 3. Extract and Validate Category IDs
  const categoryIds = formData
    .getAll("category_ids")
    .filter((id): id is string => typeof id === "string" && id.length > 0)
  // Note: Accepting string UUIDs based on form submission.
  // This assumes the database schema for categories.id is UUID or handles string input,
  // potentially differing from the int8 type noted in app-tables.mdc.

  // 4. Extract Image Data from FormData
  // Comment out unused variable if not needed for logic yet
  /*
  const existingImageUrls = formData
    .getAll("existing_image_urls")
    .filter((url): url is string => typeof url === "string")
  */
  const imagesToDelete = formData.getAll("images_to_delete").filter((url): url is string => typeof url === "string")
  const newImageFiles = formData
    .getAll("new_images")
    .filter((file): file is File => file instanceof File && file.size > 0)

  // --- Database & Storage Operations ---
  try {
    // 5. Fetch existing product and check ownership
    const { data: existingProductData, error: fetchError } = await supabase
      .from("products")
      .select("id, user_id, company_id, image_links, product_categories ( category_id )")
      .eq("id", productId)
      .single()

    if (fetchError) throw fetchError
    if (!existingProductData) throw new Error("Product not found.")
    if (existingProductData.user_id !== user.id || existingProductData.company_id !== companyIdNum) {
      return handleActionError(new Error("Permission denied"), "You do not have permission to update this product.")
    }

    const currentImageLinks = existingProductData.image_links || []

    // 6. Delete Images Marked for Deletion
    const deletionResult = await deleteImagesFromServer(supabase, imagesToDelete)
    if (deletionResult.errors.length > 0) {
      const errorMessages = deletionResult.errors.map((e) => `URL ${e.url}: ${e.message}`)
      // Don't block update, but report errors
      console.warn("Image deletion errors:", errorMessages)
      // Optionally add to the state to inform the user non-critically?
    }

    // 7. Upload New Images
    let newUploadedUrls: string[] = []
    const MAX_TOTAL_IMAGES = 5
    const remainingSlots = MAX_TOTAL_IMAGES - (currentImageLinks.length - imagesToDelete.length)

    if (newImageFiles.length > remainingSlots) {
      return {
        message: `Cannot add ${newImageFiles.length} new images. Maximum total images allowed is ${MAX_TOTAL_IMAGES}. You have ${currentImageLinks.length - imagesToDelete.length} existing images remaining.`, // More informative message
        type: "error",
        errors: { image_links: [`Maximum ${MAX_TOTAL_IMAGES} total images allowed.`] },
      }
    }

    if (newImageFiles.length > 0) {
      const uploadResult = await uploadImagesToServer(supabase, newImageFiles, companyId)
      if (uploadResult.errors.length > 0) {
        const errorMessages = uploadResult.errors.map((e) => `${e.name}: ${e.message}`)
        return {
          message: "Some new images failed to upload. Product not updated.",
          type: "error",
          errors: { image_links: errorMessages },
        }
      }
      newUploadedUrls = uploadResult.uploadedUrls
    }

    // 8. Determine Final Image List
    const finalImageLinks = [
      ...currentImageLinks.filter((url: string) => !imagesToDelete.includes(url)), // Added type to url
      ...newUploadedUrls, // Add newly uploaded
    ]

    // 9. Update Product Data
    const { error: productUpdateError } = await supabase
      .from("products")
      .update({ ...productData, image_links: finalImageLinks })
      .eq("id", productId)
      .eq("user_id", user.id) // Ensure ownership again

    if (productUpdateError) throw productUpdateError

    // 10. Update Categories (Handle additions and deletions)
    // Ensure comparison is string vs string
    const existingCategoryIds = existingProductData.product_categories?.map((pc) => String(pc.category_id)) || []
    const newCategoryIds = categoryIds // Use the string IDs from form
    const idsToAdd = newCategoryIds.filter((id) => !existingCategoryIds.includes(id))
    const idsToRemove = existingCategoryIds.filter((id) => !newCategoryIds.includes(id))

    // Link new categories
    if (idsToAdd.length > 0) {
      const categoriesToLink = idsToAdd.map((catId) => ({ product_id: productId, category_id: catId }))
      const { error: linkError } = await supabase.from("product_categories").insert(categoriesToLink)
      if (linkError) {
        // Log error but don't necessarily fail the whole update
        console.error(`Failed to link new categories: ${linkError.message}`)
        // Potentially return a partial success/warning message
      }
    }

    // Unlink removed categories
    if (idsToRemove.length > 0) {
      const { error: unlinkError } = await supabase
        .from("product_categories")
        .delete()
        .eq("product_id", productId)
        .in("category_id", idsToRemove)
      if (unlinkError) {
        // Log error
        console.error(`Failed to unlink categories: ${unlinkError.message}`)
      }
    }

    // 11. Success
    revalidatePath(`/dashboard/${companyIdNum}/products`)
    revalidatePath(`/dashboard/${companyIdNum}/products/${productId}`) // Revalidate specific product page

    return {
      message: `Product "${productData.name}" updated successfully!`,
      type: "success",
      data: { id: productId }, // Return product ID
    }
  } catch (error: unknown) {
    return handleActionError(error as Error, "Failed to update product due to a database or storage error.")
  }
}

// --- Server Action: Delete Product ---
export async function deleteProductAction(
  productId: string,
  // Pass necessary IDs for revalidation/checks if not easily derived
  companyId: number
): Promise<DeleteProductState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  // --- Database Operations (Ideally a Transaction/DB Function) ---
  try {
    // 1. Fetch Product Details (including image links for deletion)
    const { data: productData, error: fetchError } = await supabase
      .from("products")
      .select("user_id, image_links")
      .eq("id", productId)
      .single()

    if (fetchError) throw new Error("Failed to fetch product details before delete.")
    if (!productData) throw new Error("Product not found.")
    if (productData.user_id !== user.id) {
      return handleActionError(new Error("Permission denied"), "You do not have permission to delete this product.")
    }

    // 2. Delete Images from Storage
    if (productData.image_links && productData.image_links.length > 0) {
      // Use the updated deleteProductImage function
      const deleteImagePromises = productData.image_links.map((url: string) => deleteProductImage(supabase, url))
      try {
        await Promise.all(deleteImagePromises)
      } catch (imgErr) {
        console.error("Failed to delete one or more product images during product deletion:", imgErr)
        // Decide if you want to stop deletion or continue
        // return handleActionError(imgErr as Error, "Failed to delete associated images."); // Type assertion
      }
    }

    // 3. Delete Category Links
    const { error: deleteLinksError } = await supabase.from("product_categories").delete().eq("product_id", productId)
    if (deleteLinksError) {
      console.error("Error deleting product category links:", deleteLinksError)
      throw deleteLinksError
    }

    // 4. Delete Product
    const { error: deleteProductError } = await supabase.from("products").delete().eq("id", productId)
    if (deleteProductError) throw deleteProductError

    // 5. Revalidate & Success
    revalidatePath(`/dashboard/${companyId}/products`)
    revalidatePath(`/dashboard/${companyId}/categories`) // Categories might show product counts
    // Revalidate catalogs if products appear there
    revalidatePath(`/dashboard/${companyId}/catalogs`, "layout")

    return { message: "Product deleted successfully.", type: "success" }
  } catch (error: unknown) {
    return handleActionError(error as Error, "Failed to delete product due to a database error.")
  }
}
