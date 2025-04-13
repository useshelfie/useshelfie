"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteProductAction } from "@/app/dashboard/[company_id]/products/actions"
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
import { toast } from "sonner" // Assuming sonner for toasts

interface DeleteProductButtonProps {
    productId: string
    productName: string
    companyId: number
}

export function DeleteProductButton({ productId, productName, companyId }: DeleteProductButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        setError(null)
        try {
            const result = await deleteProductAction(productId, companyId)
            if (result.type === "success") {
                toast.success(result.message || "Product deleted successfully.")
                setIsOpen(false)
                // Redirect back to the products list
                router.push(`/dashboard/${companyId}/products`)
                router.refresh() // Refresh server components
            } else {
                setError(result.message || "Failed to delete product.")
                toast.error(result.message || "Failed to delete product.")
            }
        } catch (err) {
            console.error("Delete Product Error:", err)
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
                <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product
                        <span className="font-semibold"> {productName} </span>
                        and remove its data from our servers.
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
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
} 