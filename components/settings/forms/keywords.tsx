"use client"

import React, { useState, useEffect, useRef, useActionState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { addKeywordsToCompany, CompanyKeywordsFormState } from "@/lib/actions/company"

// Import shared component
import { SubmitButton } from "./shared/SubmitButton"

const initialKeywordsState: CompanyKeywordsFormState = { message: "", type: null }

function KeywordsInput({
  initialKeywords,
  onKeywordsChange,
  disabled,
}: {
  initialKeywords: string[]
  onKeywordsChange: (keywords: string[]) => void
  disabled?: boolean
}) {
  const [inputValue, setInputValue] = useState("")
  const [keywords, setKeywords] = useState<string[]>(initialKeywords)

  useEffect(() => {
    onKeywordsChange(keywords)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const newKeyword = inputValue.trim()
      if (newKeyword && !keywords.includes(newKeyword)) {
        setKeywords([...keywords, newKeyword])
        setInputValue("")
      }
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove))
  }

  return (
    <div className="space-y-2">
      <Input
        id="keywords-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a keyword and press Enter"
        disabled={disabled}
      />
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {keywords.map((keyword) => (
          <Badge key={keyword} variant="secondary">
            {keyword}
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => removeKeyword(keyword)}>
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function KeywordsForm({ companyId, initialKeywords = [] }: { companyId: string; initialKeywords?: string[] }) {
  const [state, formAction] = useActionState(addKeywordsToCompany, initialKeywordsState)
  const [currentKeywords, setCurrentKeywords] = useState<string[]>(initialKeywords)

  useEffect(() => {
    if (state.type === "success") {
      toast.success(state.message || "Keywords updated successfully!")
    } else if (state.type === "error") {
      toast.error(state.message || "Failed to update keywords.")
    }
  }, [state])

  // Prepare form data for submission
  const handleSubmit = (formData: FormData) => {
    formData.set("keywords", JSON.stringify(currentKeywords))
    formAction(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Keywords</CardTitle>
        <CardDescription>Add keywords that describe your company or products.</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent>
          <Label htmlFor="keywords-input">Keywords</Label>
          <KeywordsInput initialKeywords={initialKeywords} onKeywordsChange={setCurrentKeywords} />
          <input type="hidden" name="companyId" value={companyId} />
          {/* Error display logic */}
          {state.errors?.keywords && (
            <p className="text-sm text-destructive mt-2">{state.errors.keywords.join(", ")}</p>
          )}
          {state.errors?.database && (
            <p className="text-sm text-destructive mt-2">{state.errors.database.join(", ")}</p>
          )}
        </CardContent>
        <CardFooter>
          {/* Use shared SubmitButton */}
          <SubmitButton text="Save Keywords" pendingText="Saving..." />
        </CardFooter>
      </form>
    </Card>
  )
}
