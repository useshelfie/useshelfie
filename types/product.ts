export type Product = {
  id: string
  user_id: string
  name: string
  description?: string
  price: number
  created_at: string
  company_id: number
  image_links?: string[]
  catalog_id?: number | null
}
