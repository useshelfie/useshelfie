// schemas/categorySchema.ts
import { z } from "zod"

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters long" })
    .max(50, { message: "Category name too long" }),
})

export const categoryDatabaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  company_id: z.string(),
})

export type CategoryFormData = z.infer<typeof categorySchema>
