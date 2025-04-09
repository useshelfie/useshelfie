// components/product-form.tsx
"use client"

import React, { useState, useEffect, useRef, useTransition, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Loader2, PlusCircle, X } from "lucide-react"

// Shadcn UI Imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

// Types
type Category = { id: string; name: string }

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
  const [productState, productFormAction] = useActionState(createProductAction, initialProductState)

  // Reset form on successful submission
  useEffect(() => {
    if (productState.type === "success") {
      productFormRef.current?.reset()
      setSelectedCategories([])
    }
  }, [productState])

  // Set companyId from url
  useEffect(() => {
    const pathname = window.location.pathname
    const companyId = pathname.split("/")[2] // Assuming the URL is like /dashboard/companyId
    setCompanyId(companyId)
    console.log("Company ID from URL:", companyId)
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
      <form ref={productFormRef} action={productFormAction} className="space-y-6">
        <CardContent className="space-y-4">
          {/* Error/Success Alert */}
          {productState.message && productState.type && (
            <Alert variant={productState.type === "error" ? "destructive" : "default"}>
              <AlertTitle>{productState.type === "error" ? "Error" : "Success"}</AlertTitle>
              <AlertDescription>{productState.message}</AlertDescription>
            </Alert>
          )}

          {/* Form Fields */}
          <Field label="Product Name" name="name" required errors={productState.errors?.name} />
          <Field label="Description" name="description" as="textarea" errors={productState.errors?.description} />
          <Field
            label="Price"
            name="price"
            type="number"
            required
            step="0.01"
            min="0"
            errors={productState.errors?.price || productState.errors?.database}
          />

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
              {productState.errors?.categories?.map((e) => <p key={e}>{e}</p>)}
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
          <SubmitButton pendingText="Creating Product..." text="Create Product" />
          <input readOnly type="hidden" name="companyId" value={companyId} />
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
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  step?: string
  min?: string
  errors?: string[]
  as?: "input" | "textarea"
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

  useEffect(() => {
    if (state.type === "success" && state.newCategory) {
      onCategoryCreated(state.newCategory)
      formRef.current?.reset()
    }
  }, [state, onCategoryCreated])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    startTransition(() => formAction(new FormData(e.currentTarget)))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogDescription>Enter a name for the new category.</DialogDescription>
      </DialogHeader>
      {state.message && state.type && (
        <Alert variant={state.type === "error" ? "destructive" : "default"}>
          <AlertTitle>{state.type === "error" ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <Field label="Category Name" name="name" required errors={state.errors?.name || state.errors?.database} />
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
