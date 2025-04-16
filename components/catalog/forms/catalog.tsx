"use client"

import React, { useEffect, useRef, useActionState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createCatalogAction, updateCatalogAction, CatalogFormState } from "@/lib/actions/catalog"

// Import shared components
import { SubmitButton } from "./shared/SubmitButton"
import { FormField } from "./shared/FormField"

// Types
type Catalog = { id: string; name: string; company_id: string }

const initialCatalogState: CatalogFormState = { message: "", type: null }

export function CatalogForm({ catalog, companyId }: { catalog?: Catalog; companyId: string }) {
  const isEditMode = !!catalog
  const formAction = isEditMode ? updateCatalogAction : createCatalogAction
  const [state, submitAction] = useActionState(formAction, initialCatalogState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
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
        <CardTitle>{isEditMode ? "Edit Catalog" : "Create New Catalog"}</CardTitle>
      </CardHeader>
      <form ref={formRef} action={submitAction} className="space-y-6">
        <CardContent className="space-y-4">
          {isEditMode && <input type="hidden" name="id" value={catalog.id} />}
          <input type="hidden" name="companyId" value={companyId} />

          <FormField // Use shared component
            label="Catalog Name"
            name="name"
            required
            defaultValue={catalog?.name}
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
            text={isEditMode ? "Update Catalog" : "Create Catalog"}
            pendingText={isEditMode ? "Updating..." : "Creating..."}
          />
        </div>
      </form>
    </Card>
  )
}

// Removed: SubmitButton
// Removed: Field
