// app/dashboard/products/actions.ts
"use server"

import { revalidatePath } from "next/cache"
// import { redirect } from "next/navigation" // No longer needed here
import { createClient } from "@/lib/supabase/server"
import { productSchema } from "@/schemas/productSchema"
import type { Product } from "@/types/product"
import { getAuthenticatedUser, handleActionError, type ActionState } from "@/lib/actions/helpers" // Import helpers
import { ZodError } from "zod"
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

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
export type ProductFormState = ActionState<Pick<Product, 'id'> | undefined, ProductActionStateErrors>

export type DeleteProductState = ActionState<undefined, { database?: string[] }>;

// --- Helper: Validate Product Form Data ---
function validateProductForm(formData: FormData): { success: true; data: Omit<Product, 'id' | 'user_id' | 'company_id' | 'created_at' | 'catalog_id'> } |
{ success: false; state: ProductFormState } {
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    // Ensure image_links are handled correctly (as array of strings)
    image_links: formData.getAll("image_links").filter((url): url is string => typeof url === "string" && url.length > 0),
  };

  const validatedFields = productSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Product Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      state: {
        message: "Product validation failed.",
        errors: validatedFields.error.flatten().fieldErrors,
        type: "error",
      }
    };
  }
  // Type assertion needed as schema includes fields not directly from form here
  return { success: true, data: validatedFields.data as any };
}

// --- Placeholder Storage Actions ---

async function uploadProductImage(supabase: SupabaseClient, file: File, productId: string): Promise<string> {
  // TODO: Implement actual Supabase Storage upload logic
  // 1. Generate a unique file path (e.g., `public/${productId}/${Date.now()}_${file.name}`)
  // 2. Use `supabase.storage.from('product-images').upload(filePath, file)`
  // 3. Handle errors
  // 4. Construct and return the public URL using `supabase.storage.from('product-images').getPublicUrl(filePath)`
  console.log(`Placeholder: Uploading ${file.name} for product ${productId}`);
  // Return a placeholder URL for now
  const placeholderUrl = `https://placehold.co/600x400?text=Uploaded+${encodeURIComponent(file.name)}`;
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return placeholderUrl;
}

async function deleteProductImage(supabase: SupabaseClient, imageUrl: string): Promise<void> {
  // TODO: Implement actual Supabase Storage delete logic
  // 1. Extract the file path from the imageUrl (this depends on your URL structure and bucket settings)
  //    Example: If URL is https://<project>.supabase.co/storage/v1/object/public/product-images/path/to/image.jpg
  //    The path is likely 'path/to/image.jpg'
  // 2. Use `supabase.storage.from('product-images').remove([filePath])`
  // 3. Handle errors
  console.log(`Placeholder: Deleting image ${imageUrl}`);
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
}

// --- Server Action: Create Product ---
export async function createProductAction(
  prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const supabase = await createClient()
  const user = await getAuthenticatedUser(supabase)

  // 1. Validate Base Product Data
  const validationResult = validateProductForm(formData);
  if (!validationResult.success) return validationResult.state;
  const productData = validationResult.data;

  // 2. Extract Company ID
  const companyId = formData.get("companyId")
  if (!companyId || typeof companyId !== "string") {
    return { message: "Missing or invalid Company ID.", type: "error", errors: { database: ["Missing or invalid Company ID."] } }
  }
  const companyIdNum = parseInt(companyId, 10); // Assuming company_id is number
  if (isNaN(companyIdNum)) {
    return { message: "Invalid Company ID format.", type: "error", errors: { database: ["Invalid Company ID format."] } }
  }

  // 3. Extract and Validate Category IDs
  const categoryIds = formData
    .getAll("category_ids")
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const numericCategoryIds = categoryIds.map(Number).filter(id => !isNaN(id) && Number.isInteger(id));
  if (numericCategoryIds.length !== categoryIds.length) {
    return {
      message: "Invalid category format submitted. Expected numbers.",
      errors: { categories: ["Invalid category ID format. Expected numbers."] },
      type: "error",
    }
  }

  // --- Database Operations ---
  // Consider wrapping in a transaction (DB function) for atomicity
  try {
    // 4. Insert Product
    const { data: newProduct, error: productInsertError } = await supabase
      .from("products")
      .insert({
        ...productData,
        user_id: user.id,
        company_id: companyIdNum, // Use parsed number
      })
      .select("id")
      .single()

    if (productInsertError) throw productInsertError; // Throw to be caught below
    if (!newProduct) throw new Error("Failed to create product or retrieve ID.");
    const newProductId = newProduct.id;

    // 5. Link Categories (if any)
    if (numericCategoryIds.length > 0) {
      const { data: validCategories, error: categoryCheckError } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", companyIdNum) // Also check company ID for safety
        .in("id", numericCategoryIds)

      if (categoryCheckError) {
        console.error("Error verifying categories:", categoryCheckError)
        // Don't throw, but return error state as product exists but categories failed
        return {
          message: `Product created, but failed to verify categories: ${categoryCheckError.message}`,
          type: "error",
          errors: { database: [`Failed to verify categories: ${categoryCheckError.message}`] }
        }
      }

      const validCategoryIds = validCategories?.map((c) => c.id) ?? [];
      const categoriesToLink = numericCategoryIds
        .filter((id) => validCategoryIds.includes(id)) // Only link valid, owned categories
        .map((catId) => ({ product_id: newProductId, category_id: catId }))

      if (categoriesToLink.length !== numericCategoryIds.length) {
        // Some selected categories were not valid/owned
        console.warn("Some selected categories were invalid or not owned by the user.")
        // Decide if this is an error or just proceed linking the valid ones
      }

      if (categoriesToLink.length > 0) {
        const { error: linkError } = await supabase.from("product_categories").insert(categoriesToLink)
        if (linkError) {
          console.error("Supabase Category Link Error:", linkError)
          // Don't throw, return error state
          return {
            message: `Product created, but failed to link categories: ${linkError.message}`,
            type: "error",
            errors: { database: [`Failed to link categories: ${linkError.message}`] }
          }
        }
      }
    }

    // 6. Success
    revalidatePath(`/dashboard/${companyIdNum}/products`)

    return {
      message: `Product "${productData.name}" created successfully!`,
      type: "success",
      data: { id: newProductId } // Return new product ID
    }

  } catch (error: any) {
    // Use the shared error handler
    return handleActionError(error, "Failed to create product due to a database error.");
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

  // 1. Validate Base Product Data
  const validationResult = validateProductForm(formData);
  if (!validationResult.success) return validationResult.state;
  const productData = validationResult.data;

  // 2. Extract Company ID (Should be consistent with the product being updated)
  const companyIdStr = formData.get("companyId")
  if (!companyIdStr || typeof companyIdStr !== "string") {
    return { message: "Missing or invalid Company ID.", type: "error", errors: { database: ["Missing or invalid Company ID."] } }
  }
  const companyIdNum = parseInt(companyIdStr, 10);
  if (isNaN(companyIdNum)) {
    return { message: "Invalid Company ID format.", type: "error", errors: { database: ["Invalid Company ID format."] } }
  }

  // 3. Extract and Validate Category IDs
  const categoryIds = formData
    .getAll("category_ids")
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const newNumericCategoryIds = categoryIds.map(Number).filter(id => !isNaN(id) && Number.isInteger(id));
  if (newNumericCategoryIds.length !== categoryIds.length) {
    return {
      message: "Invalid category format submitted. Expected numbers.",
      errors: { categories: ["Invalid category ID format. Expected numbers."] },
      type: "error",
    }
  }

  // Extract image data from FormData
  const existingImageUrls = formData.getAll('existing_image_urls').filter((url): url is string => typeof url === 'string');
  const imagesToDelete = formData.getAll('images_to_delete').filter((url): url is string => typeof url === 'string');
  const newImageFiles = formData.getAll('new_images').filter((file): file is File => file instanceof File && file.size > 0);

  // --- Database Operations (Ideally a Transaction/DB Function) ---
  try {
    // 4. Fetch existing product and its categories for comparison and auth check
    const { data: existingProductData, error: fetchError } = await supabase
      .from('products')
      .select(`
                id,
                company_id,
                user_id,
                product_categories ( category_id ),
                image_links
            `)
      .eq('id', productId)
      .single();

    if (fetchError) throw new Error("Failed to fetch existing product data.");
    if (!existingProductData) throw new Error("Product not found.");
    if (existingProductData.user_id !== user.id) {
      return handleActionError({}, "You do not have permission to update this product.");
    }
    if (existingProductData.company_id !== companyIdNum) {
      return handleActionError({}, "Company ID mismatch.");
    }

    const existingCategoryIds = existingProductData.product_categories.map(pc => pc.category_id);

    // 5. Handle Image Deletions from Storage
    const deletePromises = imagesToDelete.map(url => deleteProductImage(supabase, url));
    await Promise.all(deletePromises);

    // 6. Handle Image Uploads to Storage
    const uploadPromises = newImageFiles.map(file => uploadProductImage(supabase, file, productId));
    const newImageUrls = await Promise.all(uploadPromises);

    // 7. Construct Final Image Links Array
    const finalImageLinks = existingImageUrls
      .filter(url => !imagesToDelete.includes(url)) // Remove deleted URLs
      .concat(newImageUrls); // Add newly uploaded URLs

    // 8. Update Product Details (including the final image_links)
    const { error: productUpdateError } = await supabase
      .from("products")
      .update({
        ...productData, // name, description, price
        image_links: finalImageLinks // Update image links
      })
      .eq("id", productId);

    if (productUpdateError) throw productUpdateError;

    // 9. Update Category Links
    const categoriesToAdd = newNumericCategoryIds.filter(id => !existingCategoryIds.includes(id));
    const categoriesToRemove = existingCategoryIds.filter(id => !newNumericCategoryIds.includes(id));

    if (categoriesToRemove.length > 0) {
      const { error: deleteLinkError } = await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId)
        .in('category_id', categoriesToRemove);
      if (deleteLinkError) {
        console.error("Error removing category links:", deleteLinkError);
        // Decide how to handle partial failure - maybe log and continue?
      }
    }

    if (categoriesToAdd.length > 0) {
      // Optional: Verify categoriesToAdd belong to the user/company first
      const categoriesToLink = categoriesToAdd.map(catId => ({ product_id: productId, category_id: catId }));
      const { error: addLinkError } = await supabase
        .from('product_categories')
        .insert(categoriesToLink);
      if (addLinkError) {
        console.error("Error adding category links:", addLinkError);
        // Decide how to handle partial failure
        // Maybe return specific error state here?
        return {
          message: `Product updated, but failed to link some categories: ${addLinkError.message}`,
          type: "error",
          errors: { database: [`Failed to link categories: ${addLinkError.message}`] }
        }
      }
    }

    // 10. Revalidate & Success
    revalidatePath(`/dashboard/${companyIdNum}/products`)
    revalidatePath(`/dashboard/${companyIdNum}/products/${productId}`) // Revalidate specific product page
    // Revalidate categories pages if needed?
    revalidatePath(`/dashboard/${companyIdNum}/categories`)

    return {
      message: `Product "${productData.name}" updated successfully!`,
      type: "success",
      data: { id: productId } // Return product ID
    }

  } catch (error: any) {
    return handleActionError(error, "Failed to update product due to a database error.");
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
      .from('products')
      .select('user_id, image_links')
      .eq('id', productId)
      .single();

    if (fetchError) throw new Error("Failed to fetch product details before delete.");
    if (!productData) throw new Error("Product not found.");
    if (productData.user_id !== user.id) {
      return handleActionError({}, "You do not have permission to delete this product.");
    }

    // 2. Delete Images from Storage
    if (productData.image_links && productData.image_links.length > 0) {
      // Explicitly type 'url' as string here
      const deleteImagePromises = productData.image_links.map((url: string) => deleteProductImage(supabase, url));
      try {
        await Promise.all(deleteImagePromises);
      } catch (imgErr) {
        console.error("Failed to delete one or more product images during product deletion:", imgErr);
        // Decide if you want to stop deletion or continue
        // return handleActionError(imgErr, "Failed to delete associated images."); 
      }
    }

    // 3. Delete Category Links 
    const { error: deleteLinksError } = await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId);
    if (deleteLinksError) {
      console.error("Error deleting product category links:", deleteLinksError);
      throw deleteLinksError;
    }

    // 4. Delete Product
    const { error: deleteProductError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (deleteProductError) throw deleteProductError;

    // 5. Revalidate & Success
    revalidatePath(`/dashboard/${companyId}/products`)
    revalidatePath(`/dashboard/${companyId}/categories`) // Categories might show product counts
    // Revalidate catalogs if products appear there
    revalidatePath(`/dashboard/${companyId}/catalogs`, 'layout')

    return { message: "Product deleted successfully.", type: "success" };

  } catch (error: any) {
    return handleActionError(error, "Failed to delete product due to a database error.");
  }
}
