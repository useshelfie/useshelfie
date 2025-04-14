"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useState, useTransition } from "react"
import { updateCompanySettings } from "@/lib/actions/company-settings"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Define the Zod schema for form validation
const settingsFormSchema = z.object({
    name: z.string().min(2, {
        message: "Company name must be at least 2 characters.",
    }),
    word1: z.string().min(1, { message: "Word 1 is required." }),
    word2: z.string().min(1, { message: "Word 2 is required." }),
    word3: z.string().min(1, { message: "Word 3 is required." }),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

interface SettingsFormProps {
    companyId: string
    initialName: string
    initialThreeWords: [string, string, string]
}

export default function SettingsForm({ companyId, initialName, initialThreeWords }: SettingsFormProps) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            name: initialName,
            word1: initialThreeWords[0] || "",
            word2: initialThreeWords[1] || "",
            word3: initialThreeWords[2] || "",
        },
        mode: "onChange", // Validate on change for better UX
    })

    async function onSubmit(data: SettingsFormValues) {
        setError(null) // Clear previous errors
        startTransition(async () => {
            const result = await updateCompanySettings(companyId, data)
            if (result.success) {
                toast.success(result.message)
                // Optionally reset form or redirect
                // form.reset(data); // Reset with new successful data
            } else {
                toast.error(result.message)
                setError(result.message) // Display server-side error message
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your Company Inc." {...field} />
                            </FormControl>
                            <FormDescription>
                                This is your public display name.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <FormLabel>Describe your business in three words</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="word1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Word 1</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Innovative" {...field} />
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
                                    <FormLabel className="sr-only">Word 2</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Sustainable" {...field} />
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
                                    <FormLabel className="sr-only">Word 3</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Global" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormDescription>
                        These words help define your company's identity.
                    </FormDescription>
                </div>
                
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                <Button type="submit" disabled={isPending}>
                    {isPending ? (
                        <>
                            <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </form>
        </Form>
    )
} 