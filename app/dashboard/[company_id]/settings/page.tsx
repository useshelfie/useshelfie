import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import SettingsForm from "./components/settings-form"
import { getAuthenticatedUser } from "@/lib/actions/helpers"
import { Metadata } from "next"

// Function to fetch company data by ID
async function getCompanyData(companyId: string) {
    const supabase = await createClient()
    const { data: company, error } = await supabase
        .from("companies")
        .select("id, name, three_words, owner_id")
        .eq("id", companyId)
        .single()

    if (error) {
        console.error("Error fetching company data:", error)
        return null
    }
    return company
}


export const metadata: Metadata = {
    title: "Settings",
    description: "Settings",
  }

export default async function CompanySettingsPage({ params }: { params: { company_id: string } }) {
    const companyId = params.company_id
    const user = await getAuthenticatedUser() // Ensures user is logged in

    if (!companyId) {
        console.error("Company ID is missing")
        notFound()
    }

    const company = await getCompanyData(companyId)

    if (!company) {
        console.error(`Company not found for ID: ${companyId}`)
        notFound()
    }

    // Authorization check: Ensure the logged-in user is the owner
    if (company.owner_id !== user.id) {
        console.warn(`User ${user.id} attempted to access settings for company ${companyId} owned by ${company.owner_id}`)
        // Redirect or show an unauthorized message, redirecting is usually safer
        redirect("/dashboard") 
    }

    // Convert three_words (potentially null or array) into an array of strings for the form
    const initialThreeWords = Array.isArray(company.three_words) 
        ? company.three_words.map(String).filter(Boolean) // Ensure elements are strings and not empty
        : []
    
    // Ensure we always have 3 elements, padding with empty strings if necessary
    const paddedThreeWords: [string, string, string] = [
        initialThreeWords[0] || "",
        initialThreeWords[1] || "",
        initialThreeWords[2] || "",
    ]

    return (
        <div className="space-y-6 container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Company Settings</CardTitle>
                    <CardDescription>Update your company's details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm 
                        companyId={company.id.toString()} // Pass companyId as string
                        initialName={company.name || ""} 
                        initialThreeWords={paddedThreeWords} 
                    />
                </CardContent>
            </Card>
        </div>
    )
} 