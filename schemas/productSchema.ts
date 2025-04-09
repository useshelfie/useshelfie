import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
  description: z.string().optional(),
  price: z.coerce
    .number({ invalid_type_error: "Price must be a number" })
    .positive({ message: "Price must be a positive number" })
    .finite(),
})

export type ProductFormData = z.infer<typeof productSchema>
