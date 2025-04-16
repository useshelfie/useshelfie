"use client"

import React, { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { PlusCircle, X } from "lucide-react"
import { CreateCategoryInlineForm } from "./CreateCategoryInline" // Import the inline form

// Type matching the usage in product.tsx
type Category = { id: string; name: string }

interface ProductCategorySelectionProps {
  initialCategories: Category[]
  selectedCategories: Category[]
  setSelectedCategories: (categories: Category[]) => void
  companyId: string // Received as string from ProductForm
  errors?: string[]
}

export function ProductCategorySelection({
  initialCategories,
  selectedCategories,
  setSelectedCategories,
  companyId,
  errors,
}: ProductCategorySelectionProps) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  // Maintain a combined list of initial and newly created categories
  const [allCategories, setAllCategories] = useState<Category[]>(initialCategories)

  // Function to toggle category selection
  const toggleCategory = (category: Category) => {
    setSelectedCategories(
      selectedCategories.some((c) => c.id === category.id)
        ? selectedCategories.filter((c) => c.id !== category.id) // Remove if already selected
        : [...selectedCategories, category] // Add if not selected
    )
  }

  // Handler for when a new category is successfully created by the inline form
  const handleNewCategoryCreated = (newCategory: { id: number; name: string }) => {
    const formattedNewCategory = { ...newCategory, id: String(newCategory.id) } // Convert ID to string to match type Category

    // Add to the list of all available categories if not already present
    setAllCategories((prev) =>
      prev.some((c) => c.id === formattedNewCategory.id)
        ? prev
        : [...prev, formattedNewCategory].sort((a, b) => a.name.localeCompare(b.name))
    )
    // Automatically select the newly created category
    setSelectedCategories([...selectedCategories, formattedNewCategory])
    setIsCategoryModalOpen(false) // Close modal
  }

  // Determine which categories are available to be selected (not already selected)
  const availableToSelect = allCategories.filter((cat) => !selectedCategories.some((sc) => sc.id === cat.id))

  return (
    <div className="space-y-2">
      <Label>Categories</Label>

      {/* Hidden inputs for form submission */}
      {selectedCategories.map((cat) => (
        <input key={cat.id} type="hidden" name="category_ids" value={cat.id} />
      ))}

      {/* Display Selected Categories */}
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
              onClick={() => toggleCategory(cat)}
              title={`Remove ${cat.name}`}>
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Display Available Categories & Create Button */}
      <div className="flex flex-wrap gap-2 pt-2">
        {availableToSelect.map((cat) => (
          <Button key={cat.id} type="button" variant="outline" size="sm" onClick={() => toggleCategory(cat)}>
            <PlusCircle className="mr-1 h-4 w-4" /> {cat.name}
          </Button>
        ))}
        {/* Dialog for creating a new category */}
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
              // Pass companyId as number, as expected by the inline form/action
              companyId={parseInt(companyId, 10)}
              onCategoryCreated={handleNewCategoryCreated}
              onClose={() => setIsCategoryModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Display Errors passed from the parent form state */}
      {errors && errors.length > 0 && (
        <div className="text-sm text-destructive mt-1">
          {errors.map((e: string, index: number) => (
            <p key={index}>{e}</p>
          ))}
        </div>
      )}
    </div>
  )
}
