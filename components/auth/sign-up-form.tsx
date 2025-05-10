"use client"

import { cn } from "@/lib/utils"
// import { createClient } from "@/lib/supabase/client" // No longer needed
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
// import { useRouter } from "next/navigation" // No longer needed
import { useActionState } from "react"
import { signupAction, SignUpFormState } from "@/app/auth/actions" // Import action
import { useFormStatus } from "react-dom"
import { Loader2, Terminal } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Initial state
const initialState: SignUpFormState = {
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
      {pending ? "Creating Account..." : "Sign up"}
    </Button>
  )
}

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  // Use action state
  const [state, formAction] = useActionState(signupAction, initialState)

  // Remove useState hooks

  // Remove handleSignUp function

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-6">
              {/* Display general/server error message */}
              {state?.type === "error" && state.message && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Sign Up Failed</AlertTitle>
                  {/* Show generic message + specific server error if available */}
                  <AlertDescription>
                    {state.message}
                    {state.errors?.server && ` (${state.errors.server.join(", ")})`}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email" // Add name
                  type="email"
                  placeholder="m@example.com"
                  required
                  aria-describedby="email-error"
                />
                <div id="email-error" aria-live="polite" className="text-sm text-destructive">
                  {state?.errors?.email?.map((e) => <p key={e}>{e}</p>)}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password" // Add name
                  type="password"
                  required
                  aria-describedby="password-error"
                />
                <div id="password-error" aria-live="polite" className="text-sm text-destructive">
                  {state?.errors?.password?.map((e) => <p key={e}>{e}</p>)}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repeat Password</Label>
                <Input
                  id="repeat-password"
                  name="repeatPassword" // Add name
                  type="password"
                  required
                  aria-describedby="repeat-password-error"
                />
                <div id="repeat-password-error" aria-live="polite" className="text-sm text-destructive">
                  {state?.errors?.repeatPassword?.map((e) => <p key={e}>{e}</p>)}
                </div>
              </div>

              <SubmitButton />
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
