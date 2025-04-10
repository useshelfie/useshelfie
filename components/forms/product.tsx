// components/product-form.tsx
"use client"

import React, { useState, useEffect, useRef, useTransition, useActionState, startTransition } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, PlusCircle, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

// Shadcn UI Imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Actions & Contexts
import { createProductAction, CreateProductFormState } from "@/app/dashboard/[company_id]/products/actions"
import { createCategoryAction, CreateCategoryFormState } from "@/app/dashboard/[company_id]/categories/actions"

// Hooks & Components
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone"

// Types
type Category = { id: string; name: string }

// Extend FormState type locally to include image_links errors temporarily
// The source type in actions.ts will be updated later
type ProductFormStateWithErrorHandling = CreateProductFormState & {
  errors?: CreateProductFormState["errors"] & {
    image_links?: string[]
  }
}

// Initial States
const initialProductState: CreateProductFormState = { message: "", type: null }
const initialCategoryState: CreateCategoryFormState = { message: "", type: null }

// --- Shared Submit Button Component ---
function SubmitButton({ pendingText, text, isPending }: { pendingText: string; text: string; isPending?: boolean }) {
  const { pending } = useFormStatus()
  const disabled = isPending !== undefined ? isPending : pending
  return (
    <Button type="submit" disabled={disabled}>
      {disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {disabled ? pendingText : text}
    </Button>
  )
}

// --- Product Form Component ---
export function ProductForm({ initialCategories }: { initialCategories: Category[] }) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<Category[]>(initialCategories)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [companyId, setCompanyId] = useState<string>("")
  const productFormRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productState, productFormAction] = useActionState(createProductAction, initialProductState)

  // --- Image Upload State & Hook ---
  const supabaseUpload = useSupabaseUpload({
    bucketName: "product-images",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxFileSize: 1024 * 1024 * 5,
    maxFiles: 5,
    path: companyId ? `${companyId}/products` : undefined,
    upsert: false,
  })

  // Public URLs of successfully uploaded images
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      // Create FormData first
      const formData = new FormData(e.currentTarget)
      
      // Upload any pending images
      if (supabaseUpload.files.length > 0 && !supabaseUpload.isSuccess) {
        await supabaseUpload.startUpload()
      }
      
      // Submit the form with the FormData we created earlier
      startTransition(async () => {
        await productFormAction(formData)
      })
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to submit form')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Form Submission Result (Success/Error Toasts)
  useEffect(() => {
    // Only show toast if we have a message and we're not submitting
    if (productState.message && !isSubmitting) {
      if (productState.type === "success") {
        toast.success(productState.message)
        productFormRef.current?.reset()
        setSelectedCategories([])
        supabaseUpload.setFiles([])
        setUploadedImageUrls([])
        setImagePreviewUrls([])
        supabaseUpload.setErrors([])
      } else if (productState.type === "error") {
        toast.error(productState.message)
      }
    }
  }, [productState, isSubmitting])

  // Derive public URLs when upload succeeds
  useEffect(() => {
    if (supabaseUpload.isSuccess && supabaseUpload.successes.length > 0) {
      const publicUrls = supabaseUpload.successes.map((uploadedPath) => {
        const { data } = createClient().storage.from("product-images").getPublicUrl(uploadedPath)
        return data.publicUrl
      })
      setUploadedImageUrls(publicUrls)
    }
  }, [supabaseUpload.isSuccess, supabaseUpload.successes])

  // Create preview URLs for selected files
  useEffect(() => {
    const newPreviewUrls = supabaseUpload.files.filter((file) => file.preview).map((file) => file.preview as string)
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    setImagePreviewUrls(newPreviewUrls)
    return () => {
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [supabaseUpload.files])

  // Set companyId from url
  useEffect(() => {
    const pathname = window.location.pathname
    const companyId = pathname.split("/")[2]
    if (companyId) {
      setCompanyId(companyId)
      console.log("Company ID for upload path:", companyId)
    }
  }, [])

  // Toggle category selection
  const toggleCategory = (category: Category) =>
    setSelectedCategories((prev) =>
      prev.some((c) => c.id === category.id) ? prev.filter((c) => c.id !== category.id) : [...prev, category]
    )

  // Handle new category creation
  const handleNewCategoryCreated = (newCategory: Category) => {
    setAvailableCategories((prev) =>
      prev.some((c) => c.id === newCategory.id)
        ? prev
        : [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))
    )
    setSelectedCategories((prev) => [...prev, newCategory])
    setIsCategoryModalOpen(false)
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create New Product</CardTitle>
      </CardHeader>
      <form ref={productFormRef} onSubmit={handleSubmit} className="space-y-6">
        <CardContent className="space-y-4">
          {/* Form Fields */}
          <Field
            label="Product Name"
            name="name"
            required
            errors={(productState as ProductFormStateWithErrorHandling).errors?.name}
          />
          <Field
            label="Description"
            name="description"
            as="textarea"
            errors={(productState as ProductFormStateWithErrorHandling).errors?.description}
          />
          <Field
            label="Price"
            name="price"
            type="number"
            required
            step="0.01"
            min="0"
            errors={(productState as ProductFormStateWithErrorHandling).errors?.price}
          />

          {/* Image Upload Dropzone */}
          <div className="space-y-2">
            <Label>
              Product Images (Max {supabaseUpload.maxFiles}, {formatBytes(supabaseUpload.maxFileSize)})
            </Label>
            {uploadedImageUrls.map((url, index) => (
              <input key={index} type="hidden" name="image_links" value={url} />
            ))}
            <Dropzone {...supabaseUpload} className={!companyId ? "pointer-events-none opacity-50" : ""}>
              <DropzoneContent />
              {supabaseUpload.files.length === 0 && <DropzoneEmptyState />}
            </Dropzone>
            {(productState as ProductFormStateWithErrorHandling).errors?.image_links && (
              <div className="text-sm text-destructive mt-1">
                {(productState as ProductFormStateWithErrorHandling).errors!.image_links!.map((e: string) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            )}
            {!companyId && (
              <p className="text-xs text-muted-foreground mt-1">
                Company ID not available yet. Cannot initialize upload path.
              </p>
            )}
          </div>

          {/* Image Previews */}
          {imagePreviewUrls.length > 0 && (
            <div className="space-y-2">
              <Label>Image Previews</Label>
              <div className="grid grid-cols-3 gap-2">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square border rounded overflow-hidden">
                    <Image src={url} alt={`Preview ${index + 1}`} fill style={{ objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Categories</Label>
            {selectedCategories.map((cat) => (
              <input key={cat.id} type="hidden" name="category_ids" value={cat.id} />
            ))}
            <div className="flex flex-wrap gap-2 rounded-md border p-2 min-h-[40px]">
              {selectedCategories.length === 0 && (
                <span className="text-sm text-muted-foreground">Select categories below...</span>
              )}
              {selectedCategories.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="flex items-center gap-1">
                  {cat.name}
                  <button type="button" onClick={() => toggleCategory(cat)} aria-label={`Remove ${cat.name}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="text-sm text-destructive">
              {(productState as ProductFormStateWithErrorHandling).errors?.categories?.map((e) => <p key={e}>{e}</p>)}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {availableCategories
                .filter((cat) => !selectedCategories.some((c) => c.id === cat.id))
                .map((cat) => (
                  <Button key={cat.id} type="button" variant="outline" size="sm" onClick={() => toggleCategory(cat)}>
                    {cat.name}
                  </Button>
                ))}
              <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    <PlusCircle className="mr-1 h-4 w-4" /> New Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <CreateCategoryInlineForm
                    onCategoryCreated={handleNewCategoryCreated}
                    onClose={() => setIsCategoryModalOpen(false)}
                    companyId={companyId}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button 
            type="submit" 
            disabled={isSubmitting || !companyId || supabaseUpload.loading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Product...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
          {companyId && <input readOnly type="hidden" name="companyId" value={companyId} />}
        </div>
      </form>
    </Card>
  )
}

// --- Simplified Field Component ---
function Field({
  label,
  name,
  type = "text",
  required,
  step,
  min,
  errors,
  as = "input",
  disabled,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  step?: string
  min?: string
  errors?: string[]
  as?: "input" | "textarea"
  disabled?: boolean
}) {
  const id = `${name}-input`
  const Component = as === "textarea" ? Textarea : Input
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Component
        id={id}
        name={name}
        type={type}
        required={required}
        step={step}
        min={min}
        aria-describedby={`${name}-error`}
        disabled={disabled}
      />
      <div id={`${name}-error`} aria-live="polite" className="text-sm text-destructive">
        {errors?.map((e) => <p key={e}>{e}</p>)}
      </div>
    </div>
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
  companyId: string
}) {
  const [state, formAction] = useActionState(createCategoryAction, initialCategoryState)
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  // Handle form result with toasts
  useEffect(() => {
    if (state.type === "success" && state.newCategory) {
      toast.success(state.message || "Category created successfully!")
      onCategoryCreated(state.newCategory)
      formRef.current?.reset()
      // onClose(); // Optionally close dialog on success
    } else if (state.type === "error") {
      toast.error(state.message || "Failed to create category.")
      console.error("Category Creation Error State:", state)
      if (state.errors) {
        console.error("Category Validation/DB Errors:", state.errors)
      }
    }
    // Add onClose to dependencies if using it inside the effect
  }, [state, onCategoryCreated /*, onClose */])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    startTransition(() => {
      const formData = new FormData(e.currentTarget)
      if (!formData.has("companyId")) {
        formData.set("companyId", companyId)
      }
      formAction(formData)
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogDescription>Enter a name for the new category.</DialogDescription>
      </DialogHeader>

      {/* --- REMOVE ALERT COMPONENT BELOW --- */}
      {/* {state.message && state.type && (
        <Alert variant={state.type === "error" ? "destructive" : "default"}>
          <AlertTitle>{state.type === "error" ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )} */}
      {/* --- END REMOVE ALERT COMPONENT --- */}

      <Field
        label="Category Name"
        name="name"
        required
        // Display potential errors from Zod or database level
        errors={state.errors?.name || state.errors?.database}
        disabled={isPending}
      />
      <input type="hidden" name="companyId" value={companyId} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <SubmitButton isPending={isPending} pendingText="Creating..." text="Create Category" />
      </div>
    </form>
  )
}

// Helper function from dropzone component (can be moved to utils)
const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB"
) => {
  const k = 1000
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  if (bytes === 0 || bytes === undefined) return size !== undefined ? `0 ${size}` : "0 bytes"
  const i = size !== undefined ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

// Need to import createClient for getPublicUrl
import { createClient } from "@/lib/supabase/client"
