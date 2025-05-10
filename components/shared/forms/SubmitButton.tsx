"use client"

import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SubmitButton({
  pendingText,
  text,
  isPending,
}: {
  pendingText: string
  text: string
  isPending?: boolean
}) {
  const { pending } = useFormStatus()
  const disabled = isPending !== undefined ? isPending : pending
  return (
    <Button type="submit" disabled={disabled}>
      {disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {disabled ? pendingText : text}
    </Button>
  )
}
