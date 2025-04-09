"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
// import { useRouter } from 'next/navigation'; // No longer needed here
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createCompany } from "@/lib/actions"
import { CompanySupabaseData } from "@/schemas/companySchema"

// Define props including the callback
interface CreateCompanyFormProps {
  onSuccess: (companyId: string) => void // Callback function when company is created
}

const formSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters." })
    .max(100, { message: "Company name must not exceed 100 characters." }),
})

// Accept props
export function CreateCompanyForm({ onSuccess }: CreateCompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // const router = useRouter(); // Remove router instance

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { companyName: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const result = (await createCompany(values)) as { success: boolean; message: string; data: CompanySupabaseData }

      if (result.success) {
        toast.success(result.message || "Company created!")
        console.log("create-company.tsx:45", "Company created successfully:", result.data)
        onSuccess(result.data.id) // Call the success callback instead of redirecting
      } else {
        toast.error(result.message || "Failed to create company.")
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Acme Corporation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create Company & Continue"}
        </Button>
      </form>
    </Form>
  )
}
