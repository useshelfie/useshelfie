"use client"

import React, { useRef, useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createCatalogAction, type CatalogFormState } from "@/app/dashboard/[company_id]/catalogs/actions"

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
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
        </>
      ) : (
        "Create Catalog"
      )}
    </Button>
  )
}

export function CreateCatalogForm({ companyId, userId }: { companyId: number; userId: string }) {
  const [state, formAction] = useActionState(createCatalogAction.bind(null, companyId, userId), initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.type === "success") {
      toast.success(state.message) // Redirect handles navigation
      // formRef.current?.reset(); // Reset form if not redirecting
    } else if (state.type === "error") {
      toast.error(state.message, {
        description: state.errors?.database?.[0] || Object.values(state.errors || {}).flat().join(", "),
      })
    }
  }, [state])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Catalog</CardTitle>
        <CardDescription>Enter the name for your new catalog.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Catalog Name</Label>
            <Input id="name" name="name" required />
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