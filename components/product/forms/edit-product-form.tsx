"use client"

import { useEffect, useState, useRef, useCallback, useActionState } from "react"
import Image from "next/image"
import { useFormStatus } from "react-dom"
import { updateProductAction, type ProductFormState } from "@/lib/actions/product"
import { createCategoryAction } from "@/lib/actions/category"
import type { Product } from "@/types/product"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleCheck, AlertTriangle, Loader2, X, UploadCloud, PlusCircle } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useDropzone, type FileRejection } from "react-dropzone"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Assuming a Category type is available or fetched
interface Category {
  id: number
  name: string
}

// Interface for File with Preview
interface FileWithPreview extends File {
  preview: string
}

interface EditProductFormProps {
  product: Product & { product_categories?: { category_id: number }[] } // Include categories for pre-population
  availableCategories: Category[] // Categories available for this company
  companyId: number
}

// Interface for category creation form state
interface CategoryFormState {
  message: string
  type: "success" | "error" | null
  data?: {
    id: number
    name: string
  }
  errors?: {
    name?: string[]
    database?: string[]
  }
}

// --- Utility: Format Bytes (Defined locally) ---
const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB"
) => {
  if (!+bytes) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = size ? [size] : ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
    </Button>
  )
}

// --- Inline Category Creation Form ---
function CreateCategoryInlineForm({
  onCategoryCreated,
  onClose,
  companyId,
}: {
  onCategoryCreated: (cat: Category) => void
  onClose: () => void
  companyId: number
}) {
  const initialCategoryState: CategoryFormState = { message: "", type: null }
  const [state, formAction] = useActionState(createCategoryAction, initialCategoryState)
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, setIsPending] = useState(false)

  // Handle form result with toasts
  useEffect(() => {
    if (state.type === "success" && state.data) {
      toast.success(state.message || "Category created successfully!")
      onCategoryCreated({ id: state.data.id, name: state.data.name })
      formRef.current?.reset()
      setIsPending(false)
    } else if (state.type === "error") {
      toast.error(state.message || "Failed to create category.")
      setIsPending(false)
    }
  }, [state, onCategoryCreated])

  const handleSubmit = (formData: FormData) => {
    setIsPending(true)
    formData.set("companyId", companyId.toString())
    formAction(formData)
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input id="name" name="name" required disabled={isPending} />
        {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name.join(", ")}</p>}
      </div>

      {state.errors?.database && (
        <div className="text-sm text-destructive">
          {state.errors.database.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Creating..." : "Create Category"}
        </Button>
      </div>
    </form>
  )
}

export function EditProductForm({ product, availableCategories, companyId }: EditProductFormProps) {
  const initialState: ProductFormState = { message: "", type: null, errors: {} }
  const updateProductWithId = updateProductAction.bind(null, product.id)
  const [state, formAction] = useActionState(updateProductWithId, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // --- State Management ---
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(() => {
    return product.product_categories?.map((pc) => pc.category_id) || []
  })

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categoriesList, setCategoriesList] = useState<Category[]>(availableCategories)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(() => {
    // Initialize with product's existing categories
    const selectedIds = product.product_categories?.map((pc) => pc.category_id) || []
    return availableCategories.filter((cat) => selectedIds.includes(cat.id))
  })

  // Image State - Simplified for new/deleted
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(product.image_links || []) // URLs from DB
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]) // URLs marked for deletion
  const [newImageFiles, setNewImageFiles] = useState<FileWithPreview[]>([]) // New File objects with previews
  const imageInputRef = useRef<HTMLInputElement>(null) // Ref for the hidden file input

  // Constants for Upload
  const MAX_TOTAL_IMAGES = 5
  const MAX_FILE_SIZE = 1024 * 1024 * 5 // 5MB
  const ALLOWED_MIME_TYPES = {
    "image/jpeg": [],
    "image/png": [],
    "image/webp": [],
    "image/gif": [],
  }
  const currentImageCount = existingImageUrls.length - imagesToDelete.length + newImageFiles.length

  // Toggle category selection
  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.some((c) => c.id === category.id) ? prev.filter((c) => c.id !== category.id) : [...prev, category]
    )

    // Also update the IDs array to maintain compatibility with existing code
    setSelectedCategoryIds((prev) =>
      prev.includes(category.id) ? prev.filter((id) => id !== category.id) : [...prev, category.id]
    )
  }

  // Handle new category creation
  const handleNewCategoryCreated = (newCategory: Category) => {
    setCategoriesList((prev) =>
      prev.some((c) => c.id === newCategory.id)
        ? prev
        : [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))
    )
    setSelectedCategories((prev) => [...prev, newCategory])
    setSelectedCategoryIds((prev) => [...prev, newCategory.id])
    setIsCategoryModalOpen(false)
  }

  // --- Dropzone Hook for New Images ---
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const currentExistingCount = existingImageUrls.length - imagesToDelete.length
      const currentNewCount = newImageFiles.length
      const availableSlots = MAX_TOTAL_IMAGES - (currentExistingCount + currentNewCount)

      if (acceptedFiles.length > availableSlots) {
        toast.error(
          `Cannot add ${acceptedFiles.length} files. Only ${availableSlots} slots remaining (Max ${MAX_TOTAL_IMAGES} total).`
        )
        acceptedFiles = acceptedFiles.slice(0, availableSlots)
        if (acceptedFiles.length === 0) return // No files can be added
      }

      const newAcceptedFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )

      setNewImageFiles((prev) => [...prev, ...newAcceptedFiles])

      // Handle rejections
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            toast.error(`File "${file.name}" is too large. Max size: ${formatBytes(MAX_FILE_SIZE)}`)
          } else if (error.code === "file-invalid-type") {
            toast.error(`File "${file.name}" has an invalid type.`)
          } else {
            toast.error(`Error with file "${file.name}": ${error.message}`)
          }
        })
      })

      if (imageInputRef.current) {
        imageInputRef.current.value = ""
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [newImageFiles, existingImageUrls.length, imagesToDelete.length]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_MIME_TYPES,
    maxSize: MAX_FILE_SIZE,
    // maxFiles constraint is handled manually in onDrop based on total count
    noClick: true,
    noKeyboard: true,
  })

  // --- Effects ---
  // Effect to show success/error messages from server action
  useEffect(() => {
    if (state.type === "success") {
      toast.success(state.message || "Product updated successfully!")
      // Reset deletion markers and new files on success
      setImagesToDelete([])
      // Clean up old previews before clearing
      newImageFiles.forEach((file) => URL.revokeObjectURL(file.preview))
      setNewImageFiles([])
      // Optionally update existingImageUrls if action returned the final list, or rely on page refresh/revalidation
    } else if (state.type === "error") {
      toast.error(state.message || "Failed to update product.")
      // Display specific image errors if present
      if (state.errors?.image_links) {
        state.errors.image_links.forEach((errMsg: string) => {
          toast.error("Image Error", { description: errMsg })
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]) // Depends only on the server action state

  // Clean up previews on unmount
  useEffect(() => {
    return () => newImageFiles.forEach((file) => URL.revokeObjectURL(file.preview))
  }, [newImageFiles])

  // --- Handlers ---
  // Remove a newly added image preview
  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => {
      const newFiles = [...prev]
      const removedFile = newFiles.splice(index, 1)[0]
      URL.revokeObjectURL(removedFile.preview) // Clean up object URL
      return newFiles
    })
  }

  // Toggle mark for deletion for an *existing* image URL
  const toggleDeleteMark = (url: string) => {
    setImagesToDelete(
      (prev) =>
        prev.includes(url)
          ? prev.filter((u) => u !== url) // Unmark
          : [...prev, url] // Mark
    )
  }

  // Function to add necessary data to FormData before submitting
  const handleFormSubmit = (formData: FormData) => {
    // Add existing URLs that are *not* marked for deletion
    existingImageUrls.forEach((url) => {
      if (!imagesToDelete.includes(url)) {
        formData.append("existing_image_urls", url)
      }
    })
    // Add URLs marked for deletion
    imagesToDelete.forEach((url) => {
      formData.append("images_to_delete", url)
    })
    // Add new image files
    newImageFiles.forEach((file) => {
      formData.append("new_images", file)
    })
    // Add selected category IDs - Using the selectedCategories approach
    selectedCategories.forEach((category) => {
      formData.append("category_ids", String(category.id))
    })

    formAction(formData) // Call the server action
  }

  return (
    // Use the handleFormSubmit wrapper
    <form action={handleFormSubmit} ref={formRef}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Messages */}
          {state.type === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
              {state.errors?.database && <p className="text-sm mt-1">{state.errors.database.join(", ")}</p>}
            </Alert>
          )}
          {state.type === "success" && (
            <Alert>
              <CircleCheck className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Hidden Company ID */}
          <input type="hidden" name="companyId" value={companyId} />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" name="name" defaultValue={product.name} required />
            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name.join(", ")}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={product.description} rows={4} />
            {state.errors?.description && (
              <p className="text-sm text-destructive">{state.errors.description.join(", ")}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (in cents)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              defaultValue={product.price} // Price is in cents
              required
              min="0"
              step="1"
            />
            <p className="text-sm text-muted-foreground">Formatted: {formatPrice(product.price)}</p>
            {state.errors?.price && <p className="text-sm text-destructive">{state.errors.price.join(", ")}</p>}
          </div>

          {/* Categories - Enhanced with the UI from product.tsx */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2 rounded-md border p-2 min-h-[40px]">
              {selectedCategories.length === 0 && (
                <span className="text-sm text-muted-foreground">Select categories below...</span>
              )}
              {selectedCategories.map((cat) => (
                <Badge key={cat.id} variant="secondary">
                  {cat.name}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={() => toggleCategory(cat)}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {categoriesList
                .filter((cat) => !selectedCategories.some((sc) => sc.id === cat.id))
                .map((cat) => (
                  <Button key={cat.id} type="button" variant="outline" size="sm" onClick={() => toggleCategory(cat)}>
                    <PlusCircle className="mr-1 h-4 w-4" /> {cat.name}
                  </Button>
                ))}
              <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <PlusCircle className="mr-1 h-4 w-4" /> New Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                    <DialogDescription>Add a new category to assign to products.</DialogDescription>
                  </DialogHeader>
                  <CreateCategoryInlineForm
                    companyId={companyId}
                    onCategoryCreated={handleNewCategoryCreated}
                    onClose={() => setIsCategoryModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            {state.errors?.categories && (
              <p className="text-sm text-destructive">{state.errors.categories.join(", ")}</p>
            )}
          </div>

          {/* --- Image Management --- */}
          <div className="space-y-4">
            <Label>Product Images (Max {MAX_TOTAL_IMAGES} total)</Label>

            {/* Existing + New Image Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {/* Display Existing Images */}
              {existingImageUrls.map((url) => (
                <div key={url} className="relative group aspect-square border rounded-md overflow-hidden">
                  <Image
                    src={url}
                    alt="Existing product image"
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                    className={`object-cover transition-opacity ${imagesToDelete.includes(url) ? "opacity-40" : ""}`}
                  />
                  {/* Overlay and Button for Deletion Mark */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-colors ${imagesToDelete.includes(url) ? "bg-destructive/60" : "bg-black/40 opacity-0 group-hover:opacity-100"}`}>
                    <Button
                      type="button"
                      variant={imagesToDelete.includes(url) ? "secondary" : "destructive"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleDeleteMark(url)}
                      title={imagesToDelete.includes(url) ? "Undo delete mark" : "Mark for deletion"}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">
                        {imagesToDelete.includes(url) ? "Undo delete mark" : "Mark for deletion"}
                      </span>
                    </Button>
                  </div>
                  {/* Hidden input included only if NOT marked for deletion (handled in handleFormSubmit) */}
                </div>
              ))}

              {/* Display New Image Previews */}
              {newImageFiles.map((file, index) => (
                <div
                  key={file.preview}
                  className="relative group aspect-square border border-dashed border-primary/50 rounded-md overflow-hidden">
                  <Image
                    src={file.preview}
                    alt={`New image ${index + 1} preview`}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeNewImage(index)}
                    title="Remove new image">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove new image</span>
                  </Button>
                </div>
              ))}

              {/* Dropzone Trigger Area */}
              {currentImageCount < MAX_TOTAL_IMAGES && (
                <div
                  {...getRootProps({
                    className: `relative flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors text-muted-foreground hover:text-primary ${isDragActive ? "border-primary bg-primary/10" : "border-border"}`,
                  })}
                  onClick={() => imageInputRef.current?.click()}
                  title={`Add image (${MAX_TOTAL_IMAGES - currentImageCount} slots left)`}>
                  {/* Apply ref directly to the input element, not via getInputProps */}
                  <input {...getInputProps()} ref={imageInputRef} />
                  <UploadCloud className="w-8 h-8" />
                  <span className="mt-1 text-xs text-center">Add Image</span>
                </div>
              )}
            </div>
            {/* Display server-side image errors */}
            {(state as ProductFormState).errors?.image_links && (
              <div className="text-sm text-destructive mt-1">
                {(state as ProductFormState).errors!.image_links!.map((e: string) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            )}
          </div>
          {/* --- End Image Management --- */}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  )
}
