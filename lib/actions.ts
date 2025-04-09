"use server"
import { createClient } from "@/lib/supabase/server"
import { CompanyFormData } from "@/schemas/companySchema"

export async function createCompany(data: {
  companyName: string
}): Promise<{ success: boolean; message: string; data: CompanyFormData | null }> {
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

  // Validate company name
  // since company name is not unique to the user, we don't need to check for duplicates
  if (!data.companyName || data.companyName.trim().length < 2) {
    return { success: false, message: "Company name must be at least 2 characters.", data: null }
  }

  // Inserting new company into the database and updating the user's profile
  try {
    const newCompany = {
      owner_id: userId,
      name: data.companyName,
    }
    const { data: companyData, error: companyError } = await supabase.from("companies").insert(newCompany).select()

    // Check for errors
    if (companyError) {
      console.error("Company creation error:", companyError)
      return { success: false, message: "Failed to create company. Please try again.", data: null }
    }

    console.log("Company creation successful.", companyData[0])
    // FIXME not safe to use type conversion through unkown, but it is a temp fix
    return {
      success: true,
      message: "Company created successfully!",
      data: companyData[0] as unknown as CompanyFormData,
    }
  } catch (error) {
    console.error("Company creation return an error:", error)
    return { success: false, message: "Failed to create company. Please try again.", data: null }
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
