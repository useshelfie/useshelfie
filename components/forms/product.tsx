// components/product-form.tsx
"use client"

import React, { useState, useEffect, useRef, useTransition, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, PlusCircle, Terminal, X } from "lucide-react"

// Shadcn UI Imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Actions & Schemas
import { createProductAction, CreateProductFormState } from "@/app/dashboard/products/actions"
import { createCategoryAction, CreateCategoryFormState } from "@/app/dashboard/categories/actions" // Import category action

// Types
type Category = { id: string; name: string }

// Initial States
const initialProductState: CreateProductFormState = { message: "", type: null }
const initialCategoryState: CreateCategoryFormState = {
  message: "",
  type: null,
}

// Submit Button for Product Form
function ProductSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" aria-disabled={pending} disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating Product..." : "Create Product"}
    </Button>
  )
}

// --- Product Form Component ---
export function ProductForm({ initialCategories }: { initialCategories: Category[] }) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<Category[]>(initialCategories)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const productFormRef = useRef<HTMLFormElement>(null)
  const [productState, productFormAction] = useActionState(createProductAction, initialProductState) // Assuming this state management is correct

  // Effect to reset form on successful product creation
  useEffect(() => {
    if (productState.type === "success") {
      productFormRef.current?.reset()
      setSelectedCategories([]) // Clear selected categories too
      // Optionally show toast notification
    }
  }, [productState])

  // Handle selecting/deselecting categories
  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.some((c) => c.id === category.id) ? prev.filter((c) => c.id !== category.id) : [...prev, category]
    )
  }

  // Update available categories when a new one is created inline
  const handleNewCategoryCreated = (newCategory: Category) => {
    setAvailableCategories((prev) => {
      // Check if a category with this ID already exists
      if (prev.some((existingCategory) => existingCategory.id === newCategory.id)) {
        // If it exists, just return the previous state unchanged
        console.warn(`Attempted to add duplicate category ID: ${newCategory.id}`)
        return prev
      }
      // If it doesn't exist, add it and sort
      return [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name))
    })
    setIsCategoryModalOpen(false) // Close modal
    // Optionally auto-select:
    setSelectedCategories((prev) => [...prev, newCategory])
  }

  return (
    <Card className="w-full max-w-lg">
      {" "}
      {/* Increased max-width */}
      <CardHeader>
        <CardTitle>Create New Product</CardTitle>
        <CardDescription>Fill in the details and select categories.</CardDescription>
      </CardHeader>
      <form ref={productFormRef} action={productFormAction} className="space-y-6">
        <CardContent className="space-y-4">
          {/* Product State Message */}
          {productState.message && productState.type && (
            <Alert variant={productState.type === "error" ? "destructive" : "default"}>
              <Terminal className="h-4 w-4" />
              <AlertTitle>{productState.type === "error" ? "Error" : "Success"}</AlertTitle>
              <AlertDescription>{productState.message}</AlertDescription>
            </Alert>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" name="name" required aria-describedby="name-error" />
            <div id="name-error" aria-live="polite" className="text-sm text-destructive">
              {productState.errors?.name?.map((e) => <p key={e}>{e}</p>)}
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} aria-describedby="description-error" />
            <div id="description-error" aria-live="polite" className="text-sm text-destructive">
              {productState.errors?.description?.map((e) => <p key={e}>{e}</p>)}
            </div>
          </div>

          {/* Price Field */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Price <span className="text-destructive">*</span>
            </Label>
            <Input id="price" name="price" type="number" required step="0.01" min="0" aria-describedby="price-error" />
            <div id="price-error" aria-live="polite" className="text-sm text-destructive">
              {productState.errors?.price?.map((e) => <p key={e}>{e}</p>)}
              {productState.errors?.database && !productState.errors.price && (
                <p>{productState.errors.database.join(", ")}</p>
              )}
            </div>
          </div>

          {/* --- Category Selection --- */}
          <div className="space-y-2">
            <Label>Categories</Label>
            {/* Hidden inputs to submit selected category IDs */}
            {selectedCategories.map((cat) => (
              <input type="hidden" key={cat.id} name="category_ids" value={cat.id} />
            ))}

            <div className="flex flex-wrap gap-2 rounded-md border p-2 min-h-[40px]">
              {selectedCategories.length === 0 && (
                <span className="text-sm text-muted-foreground">Select categories below...</span>
              )}
              {selectedCategories.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="flex items-center gap-1">
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    aria-label={`Remove ${cat.name}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="text-sm text-destructive" aria-live="polite">
              {productState.errors?.categories?.map((e) => <p key={e}>{e}</p>)}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {availableCategories
                .filter((availCat) => !selectedCategories.some((selCat) => selCat.id === availCat.id))
                .map((cat) => (
                  <Button key={cat.id} type="button" variant="outline" size="sm" onClick={() => toggleCategory(cat)}>
                    {cat.name}
                  </Button>
                ))}

              {/* --- Inline Category Creation Trigger --- */}
              <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    <PlusCircle className="mr-1 h-4 w-4" /> New Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {/* --- Inline Category Creation Form --- */}
                  <CreateCategoryInlineForm
                    onCategoryCreated={handleNewCategoryCreated}
                    onClose={() => setIsCategoryModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <ProductSubmitButton />
        </CardFooter>
      </form>
    </Card>
  )
}

// --- Inline Category Creation Form Component ---
function CreateCategoryInlineForm({
  onCategoryCreated,
  onClose,
}: {
  onCategoryCreated: (cat: Category) => void
  onClose: () => void
}) {
  const [state, formAction] = useActionState(createCategoryAction, initialCategoryState)
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition() // For form status without useFormStatus

  useEffect(() => {
    if (state.type === "success" && state.newCategory) {
      onCategoryCreated(state.newCategory) // Pass new category up
      formRef.current?.reset() // Reset inline form
    }
  }, [state, onCategoryCreated])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => {
      // Manually call the action since we prevent default
      formAction(formData)
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogDescription>Enter a name for the new category.</DialogDescription>
      </DialogHeader>

      {/* Category State Message */}
      {state.message && state.type && (
        <Alert variant={state.type === "error" ? "destructive" : "default"} className="text-xs">
          <Terminal className="h-4 w-4" />
          <AlertTitle className="text-xs">{state.type === "error" ? "Error" : "Success"}</AlertTitle>
          <AlertDescription className="text-xs">{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label htmlFor="inline-category-name">Category Name</Label>
        <Input
          id="inline-category-name"
          name="name" // Must match action/schema
          required
          disabled={isPending}
          aria-describedby="inline-category-name-error"
        />
        <div id="inline-category-name-error" aria-live="polite" className="text-sm text-destructive">
          {state.errors?.name?.map((e) => <p key={e}>{e}</p>)}
          {state.errors?.database && <p>{state.errors.database.join(", ")}</p>}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isPending ? "Creating..." : "Create Category"}
        </Button>
      </DialogFooter>
    </form>
  )
}
