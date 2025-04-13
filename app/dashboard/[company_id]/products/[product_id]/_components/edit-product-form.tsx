"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useFormState, useFormStatus } from "react-dom"
import Link from "next/link"
import { updateProductAction, type ProductFormState } from "@/app/dashboard/[company_id]/products/actions"
import type { Product } from "@/types/product"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleCheck, AlertTriangle, Loader2, X, Upload } from "lucide-react"
import { formatPrice } from "@/lib/utils"

// Assuming a Category type is available or fetched
interface Category {
  id: number
  name: string
}

interface EditProductFormProps {
  product: Product & { product_categories?: { category_id: number }[] } // Include categories for pre-population
  availableCategories: Category[] // Categories available for this company
  companyId: number
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
    </Button>
  )
}

export function EditProductForm({ product, availableCategories, companyId }: EditProductFormProps) {
  const initialState: ProductFormState = { message: "", type: null, errors: {} }
  const updateProductWithId = updateProductAction.bind(null, product.id)
  const [state, formAction] = useFormState(updateProductWithId, initialState)
  const formRef = useRef<HTMLFormElement>(null); // Ref for resetting form if needed

  // --- State Management ---
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(() => {
    return product.product_categories?.map(pc => pc.category_id) || []
  })
  // Image State
  const [imageUrls, setImageUrls] = useState<string[]>(product.image_links || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // For previewing new uploads

  // --- Effects ---
  useEffect(() => {
    if (state.type === "success") {
      // Clear new files and deletion markers on successful update
      setNewImageFiles([]);
      setImagePreviews([]);
      setImagesToDelete([]);
      // Optionally, update imageUrls state if action returned final list
      // or trigger a full page refresh if easier
      console.log("Product updated successfully!");
      // Consider formRef.current?.reset() if not relying on defaultValues
    }
    // Clear previews if form fails but files were selected
    if (state.type === "error" && newImageFiles.length > 0) {
        // Maybe show error related to images?
    }
  }, [state, newImageFiles.length]);

  // Clean up previews when component unmounts or files change
  useEffect(() => {
    return () => {
      imagePreviews.forEach(URL.revokeObjectURL);
    };
  }, [imagePreviews]);

  // --- Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setNewImageFiles(prev => [...prev, ...filesArray]);

      // Generate previews
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]); // Revoke URL
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const markExistingImageForDeletion = (url: string) => {
    if (imagesToDelete.includes(url)) {
      setImagesToDelete(prev => prev.filter(u => u !== url)); // Unmark
    } else {
      setImagesToDelete(prev => [...prev, url]); // Mark for deletion
    }
  };

  return (
    <form action={formAction} ref={formRef}>
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
              {state.errors?.database && (
                <p className="text-sm mt-1">{state.errors.database.join(", ")}</p>
              )}
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
            <Input
              id="name"
              name="name"
              defaultValue={product.name}
              required
            />
            {state.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name.join(", ")}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product.description}
              rows={4}
            />
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
            {state.errors?.price && (
              <p className="text-sm text-destructive">{state.errors.price.join(", ")}</p>
            )}
          </div>
          
          {/* Categories (Using hidden inputs for now) */}
          <div className="space-y-2">
             <Label>Categories</Label>
             {/* Placeholder for a real Multi-Select Component */}
             <div className="p-3 border rounded-md bg-muted text-muted-foreground">
                <p className="text-sm font-medium mb-2">Select Categories (Multi-Select UI needed)</p>
                 <p className="text-xs">Current IDs: {selectedCategoryIds.join(', ') || 'None'}</p>
                 <p className="text-xs mt-1">Available: {availableCategories.map(c => `${c.name} (${c.id})`).join(', ')}</p>
                 {/* Add controls here to modify selectedCategoryIds */}
             </div>
             {/* Hidden inputs to submit the category IDs */}
             {selectedCategoryIds.map(id => (
                <input key={id} type="hidden" name="category_ids" value={id} />
             ))}
            {state.errors?.categories && (
              <p className="text-sm text-destructive">{state.errors.categories.join(", ")}</p>
            )}
          </div>

          {/* --- Image Management --- */}
          <div className="space-y-4">
            <Label>Product Images</Label>

            {/* Existing Images */}
            {imageUrls.length > 0 && (
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {imageUrls.map((url) => (
                        <div key={url} className="relative group aspect-square border rounded-md overflow-hidden">
                             <Image 
                                src={url} 
                                alt="Existing product image" 
                                fill 
                                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw" 
                                className="object-cover" />
                             <input type="hidden" name="existing_image_urls" value={url} />
                             {imagesToDelete.includes(url) && (
                                <input type="hidden" name="images_to_delete" value={url} />
                             )}
                             <Button 
                                type="button"
                                variant="destructive"
                                size="icon"
                                className={`absolute top-1 right-1 h-6 w-6 opacity-80 group-hover:opacity-100 transition-opacity ${imagesToDelete.includes(url) ? 'ring-2 ring-offset-1 ring-destructive' : ''}`}
                                onClick={() => markExistingImageForDeletion(url)} 
                                title={imagesToDelete.includes(url) ? "Undo delete mark" : "Mark for deletion"}
                                >
                                    <X className="h-4 w-4" />
                             </Button>
                             {imagesToDelete.includes(url) && (
                                <div className="absolute inset-0 bg-destructive/70 flex items-center justify-center">
                                    <p className="text-xs font-semibold text-destructive-foreground">Marked for Deletion</p>
                                </div>
                             )}
                        </div>
                    ))}
                 </div>
            )}

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4 pt-4 border-t">
                     <p className="col-span-full text-sm font-medium text-muted-foreground">New Images (to be uploaded on save):</p>
                     {imagePreviews.map((previewUrl, index) => (
                        <div key={previewUrl} className="relative group aspect-square border rounded-md overflow-hidden">
                             <Image src={previewUrl} alt={`New image ${index + 1} preview`} fill sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw" className="object-cover" />
                             <Button 
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-80 group-hover:opacity-100 transition-opacity" 
                                onClick={() => removeNewImage(index)}
                                title="Remove new image">
                                    <X className="h-4 w-4" />
                             </Button>
                        </div>
                    ))}
                 </div>
            )}

            {/* Hidden File Inputs (These don't clear automatically on submit failure) */}
            {newImageFiles.map((file, index) => (
                 <input key={index} type="file" name="new_images" style={{ display: 'none' }} /> // Needs JS to re-attach files if needed
            ))}

            {/* File Upload Input */}
            <div className="pt-4 border-t">
                <Label htmlFor="new_images_input" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Add New Images...
                </Label>
                <Input
                    id="new_images_input"
                    name="new_images_upload" // Use different name if submitting directly
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp" // Adjust accepted types
                    onChange={handleFileChange}
                    className="sr-only" // Hide visually, trigger via label
                />
                 {/* Display selected file names (optional) */}
                {newImageFiles.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Selected: {newImageFiles.map(f => f.name).join(', ')}
                    </div>
                )}
            </div>
            {state.errors?.image_links && (
              <p className="text-sm text-destructive">{state.errors.image_links.join(", ")}</p>
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