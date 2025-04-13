"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { z } from "zod"

// Define the expected form data schema
const LoginSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(1, { message: "Password cannot be empty." }),
})

// Define the state shape for useActionState
export interface LoginFormState {
    message: string | null
    errors?: {
        email?: string[]
        password?: string[]
        credentials?: string[]
    }
    type: "error" | "success" | null
}

export async function loginAction(
    prevState: LoginFormState,
    formData: FormData
): Promise<LoginFormState> {
    const validatedFields = LoginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    })

    // Return validation errors
    if (!validatedFields.success) {
        return {
            message: "Invalid fields provided.",
            errors: validatedFields.error.flatten().fieldErrors,
            type: "error",
        }
    }

    const { email, password } = validatedFields.data
    // Await the client creation
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error("Login Error:", error.message) // Log server-side
        // More specific error checking could be done here based on error.message or error.code
        return {
            message: "Login failed. Please check your credentials.", // User-friendly message
            errors: { credentials: ["Invalid email or password."] },
            type: "error",
        }
    }

    // On successful login, redirect within the action
    // Note: Redirects must be called outside of try/catch blocks
    redirect("/dashboard")

    // This part is technically unreachable due to redirect, but satisfies return type
    // return { message: "Login successful! Redirecting...", type: "success" }
}

// --- Sign Up Action ---

const SignUpSchema = z
    .object({
        email: z.string().email({ message: "Please enter a valid email address." }),
        password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
        repeatPassword: z.string(),
    })
    .refine((data) => data.password === data.repeatPassword, {
        message: "Passwords do not match.",
        path: ["repeatPassword"], // Path to field to attach the error
    })

export interface SignUpFormState {
    message: string | null
    errors?: {
        email?: string[]
        password?: string[]
        repeatPassword?: string[]
        server?: string[] // For general server/API errors
    }
    type: "error" | "success" | null
}

export async function signupAction(
    prevState: SignUpFormState,
    formData: FormData
): Promise<SignUpFormState> {
    const validatedFields = SignUpSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        repeatPassword: formData.get("repeatPassword"),
    })

    if (!validatedFields.success) {
        return {
            message: "Invalid fields provided.",
            errors: validatedFields.error.flatten().fieldErrors,
            type: "error",
        }
    }

    const { email, password } = validatedFields.data

    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        console.error("Sign Up Error:", error.message)
        // TODO: Check for specific Supabase errors (e.g., user already exists)
        return {
            message: "Sign up failed. Please try again.", // Keep user-friendly
            errors: { server: [error.message] }, // Provide specific error if possible
            type: "error",
        }
    }

    // Redirect on successful sign-up request (user needs to confirm email)
    redirect("/auth/sign-up-success")
}

// --- Forgot Password Action ---

const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
})

export interface ForgotPasswordFormState {
    message: string | null
    errors?: {
        email?: string[]
        server?: string[]
    }
    type: "error" | "success" | null
}

export async function forgotPasswordAction(
    prevState: ForgotPasswordFormState,
    formData: FormData
): Promise<ForgotPasswordFormState> {
    const validatedFields = ForgotPasswordSchema.safeParse({ email: formData.get("email") })

    if (!validatedFields.success) {
        return {
            message: "Invalid email provided.",
            errors: validatedFields.error.flatten().fieldErrors,
            type: "error",
        }
    }

    const { email } = validatedFields.data

    // Construct redirect URL (consider env variable for base URL)
    // Using SITE_URL from env is more robust than relying on origin header here
    const redirectURL = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`
        : "/auth/update-password" // Fallback if env var not set

    console.log("Redirect URL for password reset:", redirectURL)

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectURL,
    })

    if (error) {
        console.error("Forgot Password Error:", error.message)
        return {
            message: "Failed to send reset email. Please try again.",
            errors: { server: [error.message] },
            type: "error",
        }
    }

    // Return success state, the form component will handle showing the success message
    return { message: "Password reset email sent successfully!", type: "success" }
}

// --- Update Password Action ---

const UpdatePasswordSchema = z.object({
    password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
})

export interface UpdatePasswordFormState {
    message: string | null
    errors?: {
        password?: string[]
        server?: string[]
    }
    type: "error" | "success" | null
}

export async function updatePasswordAction(
    prevState: UpdatePasswordFormState,
    formData: FormData
): Promise<UpdatePasswordFormState> {
    // Note: This action assumes the user is already authenticated
    // via the link clicked in the password reset email.
    // Supabase handles the session implicitly when user lands on the redirect URL.

    const validatedFields = UpdatePasswordSchema.safeParse({ password: formData.get("password") })

    if (!validatedFields.success) {
        return {
            message: "Invalid password provided.",
            errors: validatedFields.error.flatten().fieldErrors,
            type: "error",
        }
    }

    const { password } = validatedFields.data
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        console.error("Update Password Error:", error.message)
        return {
            message: "Failed to update password. Please try again.",
            errors: { server: [error.message] },
            type: "error",
        }
    }

    // Redirect to dashboard after successful password update
    redirect("/dashboard")

    // return { message: "Password updated successfully! Redirecting...", type: "success" }
}

// --- Logout Action ---

export async function logoutAction() {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error("Logout Error:", error.message)
        // Optionally handle error, though redirect is usually sufficient
        // For instance, could return an error state if using useActionState
        // For a simple button click, redirect is often the primary goal.
    }

    // Redirect to login page after sign out
    redirect("/auth/login")
} 