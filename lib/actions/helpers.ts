import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { SupabaseClient, User } from "@supabase/supabase-js"

/**
 * Retrieves the authenticated Supabase user.
 * If no user is found or an error occurs, redirects to the /login page.
 * @param supabase Optional Supabase client instance. If not provided, a new one is created.
 * @returns The authenticated User object.
 * @throws Redirects to /login if authentication fails.
 */
export async function getAuthenticatedUser(supabase?: SupabaseClient): Promise<User> {
  // Create a new client if one isn't passed, ensuring server-side client usage.
  const client = supabase ?? (await createClient())
  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) {
    console.error("Authentication Error:", error?.message || "User not found.")
    redirect("/login")
  }

  return user
}

// Basic type definition for standardized action state responses
export type ActionState<TData = unknown, TErrors = Record<string, string[] | undefined>> = {
  message: string
  type: "success" | "error" | null
  errors?: TErrors
  data?: TData
}

/**
 * Handles database or other errors within server actions, returning a standardized ActionState error object.
 * @param error The caught error object.
 * @param defaultMessage A default message to use if the error object doesn't provide one.
 * @returns A standardized error object conforming to ActionState.
 */
export function handleActionError(error: Error, defaultMessage: string): ActionState<never, { database: string[] }> {
  // Return type specifies error structure
  console.error("Action Database Error:", error)
  const message = error.message || defaultMessage
  return {
    message,
    type: "error",
    errors: { database: [message] },
  }
}
