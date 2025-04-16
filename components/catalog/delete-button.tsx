"use client"

import React, { useEffect, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"
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
import { deleteCatalogAction, type CatalogFormState } from "@/lib/actions/catalog"

const initialState: CatalogFormState = {
  message: "",
  type: null,
}

interface DeleteCatalogButtonProps {
  companyId: number
  catalogId: number
  catalogName: string
  className?: string
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <AlertDialogAction asChild>
      <Button variant="destructive" type="submit" disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
        Delete
      </Button>
    </AlertDialogAction>
  )
}

export function DeleteCatalogButton({ companyId, catalogId, catalogName, className }: DeleteCatalogButtonProps) {
  const [state, formAction] = useActionState(deleteCatalogAction.bind(null, companyId, catalogId), initialState)

  useEffect(() => {
    if (state.type === "success") {
      toast.success(state.message)
      // Revalidation handled by server action
    } else if (state.type === "error") {
      toast.error(state.message, {
        description: state.errors?.database?.[0],
      })
    }
  }, [state])

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className={className} title={`Delete catalog: ${catalogName}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Delete Catalog</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the catalog &quot;
              <strong>{catalogName}</strong>&quot;. Products within this catalog will <strong> not</strong> be deleted
              (deletion will fail if products exist).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <DeleteSubmitButton />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
