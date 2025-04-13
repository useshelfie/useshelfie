"use client"

import React, { useRef, useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateCatalogAction, type CatalogFormState } from "@/app/dashboard/[company_id]/catalogs/actions"
import { type CatalogDatabaseData } from "@/schemas/catalogSchema"

const initialState: CatalogFormState = {
  message: "",
  type: null,
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
        </>
      ) : (
        "Update Catalog"
      )}
    </Button>
  )
}

interface EditCatalogFormProps {
  companyId: number
  catalog: CatalogDatabaseData
}

export function EditCatalogForm({ companyId, catalog }: EditCatalogFormProps) {
  const [state, formAction] = useActionState(
    updateCatalogAction.bind(null, companyId, catalog.id),
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.type === "success") {
      toast.success(state.message)
    } else if (state.type === "error") {
      toast.error(state.message, {
        description: state.errors?.database?.[0] || Object.values(state.errors || {}).flat().join(", "),
      })
    }
  }, [state])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Edit Catalog</CardTitle>
        <CardDescription>Update the name of your catalog.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Catalog Name</Label>
            <Input id="name" name="name" defaultValue={catalog.name} required />
            {state.errors?.name && (
              <p className="text-sm font-medium text-destructive">{state.errors.name.join(", ")}</p>
            )}
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
} 