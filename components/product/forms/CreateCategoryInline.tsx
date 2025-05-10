import { createCategoryAction, CategoryFormState } from "@/lib/actions/category"
import React, { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"

// Update paths for shared components
import { FormField } from "@/components/shared/forms/FormField"
import { SubmitButton } from "@/components/shared/forms/SubmitButton"
import { Button } from "@/components/ui/button"

// Type for the callback function when a category is created
interface CreateCategoryInlineFormProps {
  companyId: number // Assuming companyId is passed as a number
  onCategoryCreated: (newCategory: { id: number; name: string }) => void
  onClose?: () => void // Optional callback to close the modal/dialog
}

const initialCategoryState: CategoryFormState = { message: "", type: null }

export function CreateCategoryInlineForm({ companyId, onCategoryCreated, onClose }: CreateCategoryInlineFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [categoryState, categoryFormAction] = useActionState(createCategoryAction, initialCategoryState)

  useEffect(() => {
    if (categoryState.message) {
      if (categoryState.type === "success" && categoryState.data) {
        toast.success(categoryState.message)
        onCategoryCreated(categoryState.data)
        formRef.current?.reset()
        onClose?.() // Close the form/dialog if callback provided
      } else if (categoryState.type === "error") {
        toast.error(categoryState.message)
      }
    }
  }, [categoryState, onCategoryCreated, onClose])

  return (
    <form ref={formRef} action={categoryFormAction} className="space-y-4">
      {/* Hidden input for companyId */}
      <input type="hidden" name="companyId" value={companyId} />

      <FormField label="Category Name" name="name" required errors={categoryState.errors?.name} />

      <div className="flex justify-end space-x-2">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <SubmitButton text="Create Category" pendingText="Creating..." />
      </div>
    </form>
  )
}
