"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/auth/actions"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

export function LogoutButton() {
  // Remove client-side logout function and router
  // const router = useRouter()
  // const logout = async () => {
  //   const supabase = createClient()
  //   await supabase.auth.signOut()
  //   router.push("/auth/login")
  // }

  // Use a form and the server action
  return (
    <form action={logoutAction}>
      <LogoutSubmitButton />
    </form>
  )
}

// Separate submit button to use useFormStatus
function LogoutSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} variant="outline" className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Logging out..." : "Logout"}
    </Button>
  )
}
