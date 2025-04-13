"use client"

import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { updateCompanyAction, type CompanyFormState } from "@/app/dashboard/company/actions"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleCheck, AlertTriangle, Loader2 } from "lucide-react"

// Assuming Company type exists
interface Company {
  id: number
  name: string
  // Add other fields like three_words if needed
}

interface EditCompanyFormProps {
  company: Company
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Company Changes
    </Button>
  )
}

export function EditCompanyForm({ company }: EditCompanyFormProps) {
  const initialState: CompanyFormState = { message: "", type: null, errors: {} }
  const updateCompanyWithId = updateCompanyAction.bind(null, company.id)
  const [state, formAction] = useFormState(updateCompanyWithId, initialState)

  useEffect(() => {
    if (state.type === "success") {
      console.log("Company updated successfully! (Placeholder)")
      // Potentially show toast
    }
  }, [state])

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Company Settings (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Messages */}
           {state.type === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
              {state.errors?.database && (
                <p className="text-sm mt-1">{state.errors.database.join(", ")}</p>
              )}
            </Alert>
          )}
          {state.type === "success" && (
            <Alert>
              <CircleCheck className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={company.name}
              required
            />
            {state.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name.join(", ")}</p>
            )}
          </div>

          {/* TODO: Add other updatable fields like three_words */}
           <p className="text-sm text-muted-foreground">Add other company fields here...</p>

        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  )
} 