"use client" // Make this a Client Component to manage state

import { useState } from "react"
import { useRouter } from "next/navigation" // For potential final redirect
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateCompanyForm } from "@/components/forms/create-company" // Adjust path if needed
import { OnboardingForm } from "@/components/forms/onboarding" // Adjust path if needed
import { CheckCircle } from "lucide-react" // For final success state
import { Button } from "@/components/ui/button"

// Define the possible steps
type OnboardingStep = "company" | "keywords" | "completed"

export default function MultiStepOnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("company")
  const [companyId, setCompanyId] = useState<string>("")
  const router = useRouter() // Get router instance

  // Callback for when company creation is successful
  const handleCompanyCreated = (_companyId: string) => {
    setCurrentStep("keywords")
    setCompanyId(_companyId)
  }

  // Callback for when keywords are saved successfully
  const handleKeywordsSaved = () => {
    setCurrentStep("completed")
    // Optional: Redirect after a short delay
    // setTimeout(() => {
    //   router.push('/dashboard');
    // }, 2000);
  }

  // Dynamically set card titles and descriptions
  const getCardContent = () => {
    switch (currentStep) {
      case "company":
        return {
          title: "Let's Get Started",
          description: "First, please tell us the name of your company or project.",
          form: <CreateCompanyForm onSuccess={handleCompanyCreated} />,
        }
      case "keywords":
        return {
          title: "Describe Your Business",
          description: "Great! Now, help us understand your business better with three keywords.",
          form: <OnboardingForm companyId={companyId} onSuccess={handleKeywordsSaved} />,
        }
      case "completed":
        return {
          title: "Onboarding Complete!",
          description: "You're all set up. Welcome aboard!",
          form: (
            <div className="text-center flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-muted-foreground">You can now proceed to your dashboard.</p>
              {/* Optional: Add a button to redirect immediately */}
              <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
            </div>
          ),
        }
      default:
        return { title: "", description: "", form: null } // Should not happen
    }
  }

  const { title, description, form } = getCardContent()

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4">
      {/* Animate transition (optional but nice) */}
      <Card className="w-full max-w-2xl shadow-lg transition-all duration-300 ease-in-out">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
          <CardDescription className="text-muted-foreground pt-1">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Render the appropriate form based on the current step */}
          {form}
        </CardContent>
      </Card>
    </div>
  )
}
