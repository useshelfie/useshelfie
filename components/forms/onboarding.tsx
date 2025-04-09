"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { saveBusinessWords } from "@/lib/actions"

// Define props including the callback
interface OnboardingFormProps {
  onSuccess: () => void // Callback function when words are saved
  companyId: string
}

const formSchema = z.object({
  word1: z.string().min(2, { message: "Word must be at least 2 characters." }).max(50),
  word2: z.string().min(2, { message: "Word must be at least 2 characters." }).max(50),
  word3: z.string().min(2, { message: "Word must be at least 2 characters." }).max(50),
})

// Accept props
export function OnboardingForm({ onSuccess, companyId }: OnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { word1: "", word2: "", word3: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const result = await saveBusinessWords(values, companyId)

      if (result.success) {
        toast.success(result.message || "Details saved successfully!")
        onSuccess()
      } else {
        toast.error(result.message || "Something went wrong.")
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="word1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keyword 1</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sustainable" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="word2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keyword 2</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Coffee" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="word3"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keyword 3</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Roasters" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Saving..." : "Complete Onboarding"}
        </Button>
      </form>
    </Form>
  )
}
