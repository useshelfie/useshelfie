"use client"

import React, { useEffect, useRef, useActionState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createCompanyAction, updateCompanyAction, CompanyFormState } from "@/lib/actions/company"

// Import shared components
import { SubmitButton } from "./shared/SubmitButton"
import { FormField } from "./shared/FormField"

// Types
type Company = { id: string; name: string; three_words?: string | null }

const initialCompanyState: CompanyFormState = { message: "", type: null }

export function CompanyForm({ company }: { company?: Company }) {
  const isEditMode = !!company
  const formAction = isEditMode ? updateCompanyAction : createCompanyAction
  const [state, submitAction] = useActionState(formAction, initialCompanyState)
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
        <CardTitle>{isEditMode ? "Edit Company" : "Create New Company"}</CardTitle>
      </CardHeader>
      <form ref={formRef} action={submitAction} className="space-y-6">
        <CardContent className="space-y-4">
          {isEditMode && <input type="hidden" name="id" value={company.id} />}

          <FormField // Use shared component
            label="Company Name"
            name="name"
            required
            defaultValue={company?.name}
            errors={state.errors?.name}
          />

          <FormField // Use shared component
            label="Describe your company in 3 words (optional)"
            name="three_words"
            defaultValue={company?.three_words || ""}
            errors={state.errors?.three_words}
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
            text={isEditMode ? "Update Company" : "Create Company"}
            pendingText={isEditMode ? "Updating..." : "Creating..."}
          />
        </div>
      </form>
    </Card>
  )
}
