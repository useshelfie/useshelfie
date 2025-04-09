import { z } from "zod"

export const companyFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters long" })
    .max(50, { message: "Company name too long" }),
  owner_id: z.string().optional(),
  three_words: z.array(z.string()).optional(),
})

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  owner_id: z.string(),
  three_words: z.array(z.string()).optional(),
  created_at: z.string(),
})

export type CompanyFormData = z.infer<typeof companyFormSchema>
export type CompanySupabaseData = z.infer<typeof companySchema>
