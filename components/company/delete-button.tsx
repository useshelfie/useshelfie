"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteCompanyAction } from "@/app/dashboard/company/actions"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface DeleteCompanyButtonProps {
  companyId: number
  companyName: string
}

export function DeleteCompanyButton({ companyId, companyName }: DeleteCompanyButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      // Note: This uses the placeholder action
      const result = await deleteCompanyAction(companyId)
      if (result.type === "success") {
        toast.success(result.message || "Company deleted successfully.")
        setIsOpen(false)
        // Redirect to main dashboard or company selection page
        router.push(`/dashboard`)
        router.refresh()
      } else {
        setError(result.message || "Failed to delete company.")
        toast.error(result.message || "Failed to delete company.")
      }
    } catch (err) {
      console.error("Delete Company Error:", err)
      const message = err instanceof Error ? err.message : "An unexpected error occurred."
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Company (Placeholder)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the company
            <span className="font-semibold"> {companyName} </span>
            and all associated data (products, categories, catalogs).
            <br />
            <strong className="mt-2 block">
              This feature is not fully implemented. Dependency checks and actual deletion logic are missing.
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          {/* Disable action until backend is implemented */}
          <AlertDialogAction
            onClick={handleDelete}
            disabled={true || isDeleting}
            className="bg-destructive hover:bg-destructive/90">
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete (Disabled)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
