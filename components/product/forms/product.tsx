// components/forms/product.tsx
"use client"

import React, { useState, useEffect, useRef, useActionState } from "react"
import { toast } from "sonner"

// Shadcn UI Imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Actions & Contexts
import { createProductAction, ProductFormState } from "@/lib/actions/product"

// Shared Components
import { SubmitButton } from "@/components/shared/forms/SubmitButton"
import { FormField } from "@/components/shared/forms/FormField"

// Product Specific Components
import { ProductImageUpload, type FileWithPreview } from "./ProductImageUpload"
import { ProductCategorySelection } from "./ProductCategorySelection"

// Types (Keep Category type shared or move to a types file)
type Category = { id: string; name: string }

// Extend FormState type locally if needed for specific error shapes not handled by components
type ProductFormStateWithErrorHandling = ProductFormState & {
  errors?: ProductFormState["errors"] & {
    image_links?: string[] // Keep this if image upload errors need direct handling here
    categories?: string[] // Keep this if category errors need direct handling here
  }
}

const initialProductState: ProductFormState = { message: "", type: null }

// --- Product Form Component ---
export function ProductForm({ initialCategories, companyId }: { initialCategories: Category[]; companyId: string }) {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const productFormRef = useRef<HTMLFormElement>(null)
  const [productState, productFormAction] = useActionState(createProductAction, initialProductState)

  // --- Image Handling State (Managed Here, Passed to Component) ---
  const [newImageFiles, setNewImageFiles] = useState<FileWithPreview[]>([])

  // Handle Form Submission Result (Success/Error Toasts)
  useEffect(() => {
    if (productState.message) {
      if (productState.type === "success") {
        toast.success(productState.message)
        productFormRef.current?.reset()
        setSelectedCategories([])
        // Clear images and revoke URLs
        newImageFiles.forEach((file) => URL.revokeObjectURL(file.preview))
        setNewImageFiles([])
      } else if (productState.type === "error") {
        toast.error(productState.message)
        // Specific image upload errors can still be handled here if needed
        if ((productState as ProductFormStateWithErrorHandling).errors?.image_links) {
          ;(productState as ProductFormStateWithErrorHandling).errors!.image_links!.forEach((errMsg: string) => {
            toast.error("Image Upload Error", { description: errMsg })
          })
        }
        // Specific category errors can still be handled here if needed
        if ((productState as ProductFormStateWithErrorHandling).errors?.categories) {
          ;(productState as ProductFormStateWithErrorHandling).errors!.categories!.forEach((errMsg: string) => {
            toast.error("Category Error", { description: errMsg })
          })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productState]) // Removed newImageFiles dependency as cleanup is handled in success case

  // Add files to FormData before submitting
  const handleFormSubmit = (formData: FormData) => {
    newImageFiles.forEach((file) => {
      formData.append("new_images", file) // Action needs to handle "new_images"
    })

    // --- DEBUGGING: Log category IDs being submitted ---
    const submittedCategoryIds = formData.getAll("category_ids")
    console.log("Submitting category_ids:", submittedCategoryIds)
    // --- END DEBUGGING ---

    // Append selected category IDs (handled by hidden inputs in ProductCategorySelection now)
    // selectedCategories.forEach(cat => formData.append('category_ids', cat.id));
    productFormAction(formData)
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create New Product</CardTitle>
      </CardHeader>
      <form ref={productFormRef} action={handleFormSubmit} className="space-y-6">
        <CardContent className="space-y-4">
          {/* Form Fields using shared component */}
          <FormField
            label="Product Name"
            name="name"
            required
            errors={(productState as ProductFormStateWithErrorHandling).errors?.name}
          />
          <FormField
            label="Description"
            name="description"
            as="textarea"
            errors={(productState as ProductFormStateWithErrorHandling).errors?.description}
          />
          <FormField
            label="Price"
            name="price"
            type="number"
            required
            step="0.01"
            min="0"
            errors={(productState as ProductFormStateWithErrorHandling).errors?.price}
          />

          {/* Hidden companyId input */}
          <input readOnly type="hidden" name="companyId" value={companyId} />

          {/* Image Upload Component */}
          <ProductImageUpload
            newImageFiles={newImageFiles}
            setNewImageFiles={setNewImageFiles}
            errors={(productState as ProductFormStateWithErrorHandling).errors?.image_links}
          />

          {/* Category Selection Component */}
          <ProductCategorySelection
            initialCategories={initialCategories}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            companyId={companyId}
            errors={(productState as ProductFormStateWithErrorHandling).errors?.categories}
          />
        </CardContent>
        <div className="px-6 pb-6">
          <SubmitButton text="Create Product" pendingText="Creating..." />
        </div>
      </form>
    </Card>
  )
}

// Removed: SubmitButton (moved to shared)
// Removed: Field (moved to shared as FormField)
// Removed: CreateCategoryInlineForm (moved to product/)
// Removed: formatBytes (moved to lib/utils/)
