"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { deleteCategory } from "../actions"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  description?: string
}

export function CategoryList({ categories }: { categories: Category[] }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      try {
        await deleteCategory(id)
        toast.success(`Category "${name}" deleted successfully`)
      } catch (error) {
        console.error("Error deleting category:", error)
        toast.error("Failed to delete category")
      }
    })
  }

  if (!categories?.length) {
    return <p className="text-muted-foreground">No categories found.</p>
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-4 rounded-md border bg-card text-card-foreground shadow-sm">
          <div>
            <h3 className="font-medium">{category.name}</h3>
            {category.description && <p className="text-sm text-muted-foreground mt-1">{category.description}</p>}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(category.id, category.name)}
            disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      ))}
    </div>
  )
}
