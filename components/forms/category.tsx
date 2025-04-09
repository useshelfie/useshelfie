"use client"
import { useFormStatus } from "react-dom"
import { useRef, useEffect, useActionState, useContext, useState } from "react"
import { Loader2, Terminal } from "lucide-react"
import { createCategoryAction, CreateCategoryFormState } from "@/app/dashboard/[company_id]/categories/actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const initialState: CreateCategoryFormState = { message: "", type: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating..." : "Create Category"}
    </Button>
  )
}

export function CreateCategoryForm() {
  const [state, formAction] = useActionState(createCategoryAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // handle companyId
  const [companyId, setCompanyId] = useState<string>("")

  useEffect(() => {
    if (state.type === "success") {
      formRef.current?.reset()
      // Optional: Show toast
    }
  }, [state])

  useEffect(() => {}, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Category</CardTitle>
        <CardDescription>Create a new category for your products.</CardDescription>
      </CardHeader>
      <form ref={formRef} action={formAction} className="space-y-6">
        <CardContent className="space-y-4">
          {state.message && state.type && (
            <Alert variant={state.type === "error" ? "destructive" : "default"}>
              <Terminal className="h-4 w-4" />
              <AlertTitle>{state.type === "error" ? "Error" : "Success"}</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input id="category-name" name="name" required aria-describedby="category-name-error" />
            <div id="category-name-error" aria-live="polite" className="text-sm text-destructive">
              {state.errors?.name?.map((e) => <p key={e}>{e}</p>)}
              {state.errors?.database && <p>{state.errors.database.join(", ")}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
        <input readOnly type="hidden" name="companyId" value={companyId} />
      </form>
    </Card>
  )
}
