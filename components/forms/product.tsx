// components/product-form.tsx
"use client"

import React, { useState, useEffect, useRef, useTransition, useActionState, startTransition, useCallback } from "react"
import dynamic from 'next/dynamic'; // Import dynamic
import { useFormStatus } from "react-dom"
import { Loader2, PlusCircle, X, Image as ImageIcon, UploadCloud } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useDropzone, type FileRejection, type FileError } from 'react-dropzone';

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
import { createProductAction, ProductFormState } from "@/app/dashboard/[company_id]/products/actions"
import { createCategoryAction, CategoryFormState } from "@/app/dashboard/[company_id]/categories/actions"

// Types
type Category = { id: string; name: string }

// Extend FormState type locally to include image_links errors temporarily
type ProductFormStateWithErrorHandling = ProductFormState & {
  errors?: ProductFormState["errors"] & {
    image_links?: string[]
  }
}

// Interface for File with Preview
interface FileWithPreview extends File {
  preview: string;
}

// Initial States
const initialProductState: ProductFormState = { message: "", type: null }
const initialCategoryState: CategoryFormState = { message: "", type: null }

// Dynamically import the CreateCategoryInlineForm
const DynamicCreateCategoryForm = dynamic(() =>
  import("@/components/forms/product") // Correct path to the module
    .then((mod) => mod.CreateCategoryInlineForm), // Access the exported component
  {
    loading: () => <div className="p-4 text-center">Loading...</div>, // Simple loading state
    ssr: false
  }
);

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
export function ProductForm({ initialCategories, companyId }: { initialCategories: Category[]; companyId: string }) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<Category[]>(initialCategories)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const productFormRef = useRef<HTMLFormElement>(null)
  const [productState, productFormAction] = useActionState(createProductAction, initialProductState)

  // --- New Image Handling State ---
  const [newImageFiles, setNewImageFiles] = useState<FileWithPreview[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Constants for Upload
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB
  const ALLOWED_MIME_TYPES = {
    'image/jpeg': [],
    'image/png': [],
    'image/webp': [],
    'image/gif': [],
  };

  // --- Dropzone Hook Setup ---
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    const currentFiles = newImageFiles;
    const totalFilesAfterAdd = currentFiles.length + acceptedFiles.length;

    if (totalFilesAfterAdd > MAX_FILES) {
        toast.error(`Cannot add more files. Maximum is ${MAX_FILES}.`);
        // Only add files up to the limit
        const filesToAddCount = MAX_FILES - currentFiles.length;
        acceptedFiles = acceptedFiles.slice(0, filesToAddCount);
    }

    const newAcceptedFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));

    setNewImageFiles(prev => [...prev, ...newAcceptedFiles].slice(0, MAX_FILES)); // Ensure limit strictly

    // Handle rejections (optional: show specific errors)
    fileRejections.forEach(({ file, errors }) => {
        errors.forEach(error => {
            if (error.code === 'file-too-large') {
                toast.error(`File "${file.name}" is too large. Max size: ${formatBytes(MAX_FILE_SIZE)}`);
            } else if (error.code === 'file-invalid-type') {
                toast.error(`File "${file.name}" has an invalid type.`);
            } else {
                 toast.error(`Error with file "${file.name}": ${error.message}`);
            }
        });
    });

     // Reset the file input to allow re-selecting the same file
     if (imageInputRef.current) {
        imageInputRef.current.value = "";
     }

  }, [newImageFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: ALLOWED_MIME_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES, // This primarily affects initial selection dialog
      noClick: true, // We'll trigger click manually
      noKeyboard: true,
  });

  // Remove preview
  const removeImage = (index: number) => {
      setNewImageFiles(prev => {
          const newFiles = [...prev];
          const removedFile = newFiles.splice(index, 1)[0];
          URL.revokeObjectURL(removedFile.preview); // Clean up object URL
          return newFiles;
      });
  };

  // Clean up previews on unmount
  useEffect(() => {
    return () => newImageFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }, [newImageFiles]);

  // Handle Form Submission Result (Success/Error Toasts)
  useEffect(() => {
    if (productState.message) {
      if (productState.type === "success") {
        toast.success(productState.message)
        productFormRef.current?.reset()
        setSelectedCategories([])
        setNewImageFiles([])
        newImageFiles.forEach(file => URL.revokeObjectURL(file.preview));
      } else if (productState.type === "error") {
        toast.error(productState.message)
        if (productState.errors?.image_links) {
          productState.errors.image_links.forEach((errMsg: string) => {
            toast.error("Image Upload Error", { description: errMsg });
          });
        }
      }
    }
  }, [productState, newImageFiles]);

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

  // Add files to FormData before submitting
  const handleFormSubmit = (formData: FormData) => {
      newImageFiles.forEach((file) => {
          formData.append('new_images', file);
      });
      productFormAction(formData);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create New Product</CardTitle>
      </CardHeader>
      <form ref={productFormRef} action={handleFormSubmit} className="space-y-6">
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

          {/* Hidden companyId input */}
          <input readOnly type="hidden" name="companyId" value={companyId} />

          {/* Revamped Image Upload Dropzone */}
          <div className="space-y-2">
             <Label>
                Product Images (Max {MAX_FILES}, {formatBytes(MAX_FILE_SIZE)} each)
             </Label>
            <div {...getRootProps({ className: `relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}` })}>
               <input {...getInputProps({ name: 'new_images_input', ref: imageInputRef })} />

              {newImageFiles.length === 0 && (
                <div className="text-center">
                  <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                     <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                   </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP up to {formatBytes(MAX_FILE_SIZE)}</p>
                </div>
              )}

              {newImageFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-4 w-full">
                      {newImageFiles.map((file, index) => (
                          <div key={index} className="relative aspect-square border rounded overflow-hidden group">
                              <Image src={file.preview} alt={`Preview ${index + 1}`} fill style={{ objectFit: "cover" }} />
                              <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); removeImage(index); }}
                              >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Remove image</span>
                              </Button>
                          </div>
                      ))}
                       {newImageFiles.length < MAX_FILES && (
                           <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="relative flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors text-muted-foreground hover:text-primary"
                            >
                               <ImageIcon className="w-8 h-8" />
                                <span className="mt-1 text-xs">Add Image</span>
                            </button>
                        )}
                  </div>
              )}
            </div>
             {(productState as ProductFormStateWithErrorHandling).errors?.image_links && (
               <div className="text-sm text-destructive mt-1">
                 {(productState as ProductFormStateWithErrorHandling).errors!.image_links!.map((e: string) => (
                   <p key={e}>{e}</p>
                 ))}
               </div>
             )}
          </div>

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
              {availableCategories
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
                  <DynamicCreateCategoryForm
                     companyId={companyId}
                     onCategoryCreated={handleNewCategoryCreated}
                     onClose={() => setIsCategoryModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            {(productState as ProductFormStateWithErrorHandling).errors?.categories && (
              <div className="text-sm text-destructive mt-1">
                {(productState as ProductFormStateWithErrorHandling).errors!.categories!.map((e: string) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <SubmitButton text="Create Product" pendingText="Creating..." />
        </div>
      </form>
    </Card>
  )
}

// --- Reusable Field Component ---
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
  const id = React.useId()
  const errorId = `${id}-error`
  const InputComponent = as === "textarea" ? Textarea : Input

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <InputComponent
        id={id}
        name={name}
        type={type}
        required={required}
        step={step}
        min={min}
        aria-describedby={errors ? errorId : undefined}
        aria-invalid={!!errors}
        disabled={disabled}
        // @ts-ignore - Workaround for passing props to Textarea/Input
        rows={as === "textarea" ? 3 : undefined}
      />
      {errors && (
        <div id={errorId} aria-live="polite" className="text-sm text-destructive">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Inline Category Creation Form ---
export function CreateCategoryInlineForm({
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
    if (state.type === "success" && state.data) {
      toast.success(state.message || "Category created successfully!")
      onCategoryCreated({ id: String(state.data.id), name: state.data.name })
      formRef.current?.reset()
      // onClose(); // Optionally close dialog on success
    } else if (state.type === "error") {
      toast.error(state.message || "Failed to create category.")
      console.error("Category Creation Error State:", state)
      if (state.errors) {
        console.error("Category Validation/DB Errors:", state.errors)
      }
    }
  }, [state, onCategoryCreated])

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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-4">
      <Field
        label="Category Name"
        name="name"
        required
        errors={state.errors?.name}
        disabled={isPending}
      />
      <input type="hidden" name="companyId" value={companyId} />

      {state.errors?.database && (
        <div className="text-sm text-destructive">
          {state.errors.database.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <SubmitButton text="Create Category" pendingText="Creating..." isPending={isPending} />
      </div>
    </form>
  )
}

// --- Utility: Format Bytes ---
const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB"
) => {
  if (!+bytes) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = size
    ? [size]
    : ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
