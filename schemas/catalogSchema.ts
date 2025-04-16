import { z } from "zod"

export const catalogFormSchema = z.object({
  name: z.string().min(1, { message: "Catalog name cannot be empty" }),
})

export const catalogDatabaseSchema = z.object({
  id: z.number(), // Assuming int8 maps to number
  company_id: z.number(), // Assuming int8 maps to number
  user_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(), // For nice URLs
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type CatalogFormData = z.infer<typeof catalogFormSchema>
export type CatalogDatabaseData = z.infer<typeof catalogDatabaseSchema>
