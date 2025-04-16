"use client"
import React, { useRef, useEffect, useActionState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createCategoryAction, updateCategoryAction, CategoryFormState } from "@/lib/actions/category"

// Import shared components
import { SubmitButton } from "@/components/shared/forms/SubmitButton"
import { FormField } from "@/components/shared/forms/FormField"

// Types
type Category = { id: string; name: string }

const initialCategoryState: CategoryFormState = { message: "", type: null }

export function CategoryForm({ category, companyId }: { category?: Category; companyId: string }) {
  const isEditMode = !!category
  // Bind required arguments for update action
  const boundUpdateAction = isEditMode
    ? updateCategoryAction.bind(null, parseInt(category.id, 10), parseInt(companyId, 10))
    : null
  const formAction = isEditMode && boundUpdateAction ? boundUpdateAction : createCategoryAction
  const [state, submitAction] = useActionState(formAction, initialCategoryState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    console.log("state", state)
    console.log("isEditMode", isEditMode)
    if (state.message) {
      if (state.type === "success") {
        toast.success(state.message)
        if (!isEditMode) {
          formRef.current?.reset()
        }
      } else if (state.type === "error") {
        toast.error(state.message)
      }
    }
  }, [state, isEditMode])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Category" : "Create New Category"}</CardTitle>
      </CardHeader>
      <form ref={formRef} action={submitAction} className="space-y-6">
        <CardContent className="space-y-4">
          {isEditMode && <input type="hidden" name="id" value={category.id} />}
          <input type="hidden" name="companyId" value={companyId} />

          <FormField // Use shared component
            label="Category Name"
            name="name"
            required
            defaultValue={category?.name}
            errors={state.errors?.name}
          />

          {/* Display database errors */}
          {state.errors?.database && (
            <div className="text-sm text-destructive">
              {state.errors.database.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
        </CardContent>
        <div className="px-6 pb-6">
          <SubmitButton // Use shared component
            text={isEditMode ? "Update Category" : "Create Category"}
            pendingText={isEditMode ? "Updating..." : "Creating..."}
          />
        </div>
      </form>
    </Card>
  )
}
