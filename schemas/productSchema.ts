import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
  description: z.string().optional(),
  price: z.coerce
    .number({ invalid_type_error: "Price must be a number" })
    .positive({ message: "Price must be a positive number" })
    .finite(),
  image_links: z.array(z.string().url({ message: "Invalid image URL format" })).optional(),
})

export const productDatabaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  created_at: z.string(),
  company_id: z.string(),
  image_links: z.array(z.string()).optional(),
})

export type ProductFormData = z.infer<typeof productSchema>
export type ProductDatabaseData = z.infer<typeof productDatabaseSchema>
