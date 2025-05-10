"use client"

import React, { useEffect, useRef, useActionState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateProfileAction, SettingsFormState } from "@/lib/actions/profile"

// Import shared components
import { SubmitButton } from "./shared/SubmitButton"
import { FormField } from "./shared/FormField"

// Types
type Profile = { id: string; username: string | null }

const initialSettingsState: SettingsFormState = { message: "", type: null }

export function SettingsForm({ profile }: { profile: Profile }) {
  const [state, submitAction] = useActionState(updateProfileAction, initialSettingsState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.message) {
      if (state.type === "success") {
        toast.success(state.message)
      } else if (state.type === "error") {
        toast.error(state.message)
      }
    }
  }, [state])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Update Profile Settings</CardTitle>
      </CardHeader>
      <form ref={formRef} action={submitAction} className="space-y-6">
        <CardContent className="space-y-4">
          {/* Hidden input for profile ID */}
          <input type="hidden" name="id" value={profile.id} />

          <FormField // Use shared component
            label="Username"
            name="username"
            required
            defaultValue={profile.username || ""}
            errors={state.errors?.username}
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
            text="Update Profile"
            pendingText="Updating..."
          />
        </div>
      </form>
    </Card>
  )
}
