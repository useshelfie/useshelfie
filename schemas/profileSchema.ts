import { z } from "zod"

export const profileSchema = z.object({
  username: z.string().min(3, { message: "Name must be at least 3 characters long" }),
})

export const profileDatabaseSchema = z.object({
  id: z.string(),
  username: z.string(),
  created_at: z.string(),
})

export type ProfiletFormData = z.infer<typeof profileSchema>
