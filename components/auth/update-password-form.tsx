"use client"

import { cn } from "@/lib/utils"
// import { createClient } from "@/lib/supabase/client" // No longer needed
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { useRouter } from "next/navigation" // No longer needed
import { useActionState } from "react"
import { updatePasswordAction, UpdatePasswordFormState } from "@/app/auth/actions"
import { useFormStatus } from "react-dom"
import { Loader2, Terminal } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Initial state
const initialState: UpdatePasswordFormState = {
  message: null,
  errors: undefined,
  type: null,
}

// Submit Button
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving..." : "Save new password"}
    </Button>
  )
}

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction] = useActionState(updatePasswordAction, initialState)

  // Remove useState hooks

  // Remove handleForgotPassword function (rename if desired)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Please enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-6">
              {/* Display general/server error message */}
              {state?.type === "error" && state.message && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {state.message}
                    {state.errors?.server && ` (${state.errors.server.join(", ")})`}
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  name="password" // Add name
                  type="password"
                  placeholder="New password"
                  required
                  aria-describedby="password-error"
                />
                <div id="password-error" aria-live="polite" className="text-sm text-destructive">
                  {state?.errors?.password?.map((e) => <p key={e}>{e}</p>)}
                </div>
              </div>
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
