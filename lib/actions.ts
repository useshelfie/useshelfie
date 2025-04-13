"use server"
import { createClient } from "@/lib/supabase/server"
import { companyFormSchema, CompanySupabaseData } from "@/schemas/companySchema"

export async function createCompany(data: {
  companyName: string
}): Promise<{ success: boolean; message: string; data: CompanySupabaseData | null }> {
  // Create supabase client
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // check for errors
  if (authError || !user) {
    console.error("Authentication error:", authError)
    return { success: false, message: "Authentication error. Please log in again.", data: null }
  }

  // get user id
  const userId = user.id
  console.log(`Creating company for user: ${userId}`)
  console.log("Company Name received:", data.companyName)

  // Validate company name using Zod schema
  const validation = companyFormSchema.safeParse({ name: data.companyName })
  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Invalid company name."
    return { success: false, message: firstError, data: null }
  }

  // Inserting new company into the database
  try {
    const newCompany = {
      owner_id: userId,
      name: validation.data.name, // Use validated name from schema parse result
    }
    // Select all fields matching CompanySupabaseData
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .insert(newCompany)
      .select("id, name, owner_id, three_words, created_at") // Explicitly select fields
      .single() // Expecting a single row back

    // Check for errors during insert/select
    if (companyError || !companyData) {
      console.error("Company creation/selection error:", companyError)
      return { success: false, message: "Failed to create company. Please try again.", data: null }
    }

    console.log("Company creation successful.", companyData)
    // Return the fetched data directly, no unsafe assertion needed
    return {
      success: true,
      message: "Company created successfully!",
      data: companyData, // Type now matches the promise signature
    }
  } catch (error) {
    console.error("Company creation error:", error)
    return { success: false, message: "An unexpected error occurred. Please try again.", data: null }
  }
}

export async function saveBusinessWords(data: { word1: string; word2: string; word3: string }, companyId: string) {
  if (!companyId) {
    console.error("Company ID is required.")
    return { success: false, message: "Company ID is required." }
  }

  // Create a supabase client
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Check for errors
  if (authError || !user) {
    console.error("Authentication error:", authError)
    return { success: false, message: "Authentication error. Please log in again." }
  }
  // Get user ID
  const userId = user.id

  console.log(`Saving words for: ${userId} | ${companyId}`)
  console.log("Words received:", data)
  try {
    // Check if the company ID is valid and user is the owner of the company
    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .eq("owner_id", userId)
      .single()
    if (companyError || !companyData) {
      console.error("Company not found:", companyError)
      return { success: false, message: "Company not found." }
    }

    // Update the company with provided three words into array in three_words
    const { error: updateError } = await supabase
      .from("companies")
      .update({ three_words: [data.word1, data.word2, data.word3] })
      .eq("id", companyId)
      .eq("owner_id", userId)

    if (updateError) {
      console.error("Error updating company with words:", updateError)
      return { success: false, message: "Failed to save words. Please try again." }
    }
    console.log("Simulated DB operations successful.")
    return { success: true, message: "Business details saved!" }
  } catch (error) {
    console.error("error happened while saving three words:", error)
    return { success: false, message: "Failed to save details. Please try again." }
  }
}
