"use client"

import { cn } from "@/lib/utils"
// import { createClient } from "@/lib/supabase/client" // No longer needed here
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
// import { useRouter } from "next/navigation" // No longer needed, redirect handled by action
import { useActionState } from "react"
import { loginAction, LoginFormState } from "@/app/auth/actions" // Import action and state type
import { useFormStatus } from "react-dom"
import { Loader2, Terminal } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Initial state for the form
const initialState: LoginFormState = {
  message: null,
  errors: undefined,
  type: null,
}

// Separate Submit Button component to use useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Logging in..." : "Login"}
    </Button>
  )
}

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  // Use useActionState hook
  const [state, formAction] = useActionState(loginAction, initialState)

  // Remove useState for email, password, error, isLoading
  // const [email, setEmail] = useState("")
  // const [password, setPassword] = useState("")
  // const [error, setError] = useState<string | null>(null)
  // const [isLoading, setIsLoading] = useState(false)
  // const router = useRouter() // Not needed

  // Remove handleLogin function

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Use the formAction in the form tag */}
          <form action={formAction}>
            <div className="flex flex-col gap-6">
              {/* Display general form error message */}
              {state?.type === "error" && state.message && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email" // Add name attribute for FormData
                  type="email"
                  placeholder="m@example.com"
                  required
                  aria-describedby="email-error"
                  // Remove controlled component state
                  // value={email}
                  // onChange={(e) => setEmail(e.target.value)}
                />
                {/* Display email-specific errors */}
                <div id="email-error" aria-live="polite" className="text-sm text-destructive">
                  {state?.errors?.email?.map((e) => <p key={e}>{e}</p>)}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password" // Add name attribute for FormData
                  type="password"
                  required
                  aria-describedby="password-error"
                  // Remove controlled component state
                  // value={password}
                  // onChange={(e) => setPassword(e.target.value)}
                />
                {/* Display password-specific errors */}
                <div id="password-error" aria-live="polite" className="text-sm text-destructive">
                  {state?.errors?.password?.map((e) => <p key={e}>{e}</p>)}
                </div>
              </div>
              {/* Display credential-specific errors */}
              <div id="credentials-error" aria-live="polite" className="text-sm text-destructive">
                {state?.errors?.credentials?.map((e) => <p key={e}>{e}</p>)}
              </div>

              {/* Use the SubmitButton component */}
              <SubmitButton />
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
