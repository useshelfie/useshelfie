"use client"

import { useState, useActionState } from "react"
import { useFormStatus } from "react-dom"
import { deleteCategoryAction, updateCategoryAction, type CategoryFormState } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
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
import { Loader2, Trash2, Edit, X, Check, AlertTriangle } from "lucide-react"

// Assume Category type includes id (number) and name (string)
interface Category {
    id: number
    name: string
    company_id: number // Add company_id if needed for actions
}

interface CategoryListProps {
    categories: Category[]
}

// --- Individual Category Item with Edit/Delete Functionality ---
function CategoryItem({ category }: { category: Category }) {
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const initialState: CategoryFormState = { message: "", type: null, errors: {} }
    const updateCategoryWithId = updateCategoryAction.bind(null, category.id, category.company_id)
    const [editState, formAction] = useActionState(updateCategoryWithId, initialState)

    const { pending: isSaving } = useFormStatus() // Needs to be used within the form

    const handleDeleteConfirm = async () => {
        setIsDeleting(true)
        setDeleteError(null)
        try {
            // companyId needs to be available here - assuming it's on category object
            const result = await deleteCategoryAction(category.company_id, category.id.toString())
            if (result.type === "success") {
                toast.success(result.message || "Category deleted.")
                // Row will disappear on next render due to state update/revalidation
            } else {
                setDeleteError(result.message || "Failed to delete category.")
                toast.error(result.message || "Failed to delete category.")
            }
        } catch (err: any) {
            setDeleteError(err.message || "An unexpected error occurred.")
            toast.error(err.message || "An unexpected error occurred.")
        } finally {
            setIsDeleting(false)
            // Close the dialog manually if needed, though deletion might trigger re-render
        }
    }

    return (
        <div className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors">
            {isEditing ? (
                <form action={formAction} className="flex-grow flex items-center gap-2 mr-2">
                    <Input
                        name="name"
                        defaultValue={category.name}
                        required
                        className="h-9 flex-grow"
                        aria-label="Edit category name"
                    />
                    {editState?.errors?.name && <p className="text-xs text-destructive">{editState.errors.name[0]}</p>}
                     <Button type="submit" size="icon" variant="ghost" disabled={isSaving} className="h-9 w-9">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                        <span className="sr-only">Save</span>
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="h-9 w-9">
                        <X className="h-4 w-4" />
                         <span className="sr-only">Cancel</span>
                    </Button>
                </form>
            ) : (
                <span className="font-medium flex-grow truncate mr-2" title={category.name}>{category.name}</span>
            )}

            {!isEditing && (
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                         <span className="sr-only">Edit</span>
                    </Button>
                    
                    {/* Delete Button with Dialog */}
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Deleting the category "<span className="font-semibold">{category.name}</span>" cannot be undone. Products using this category might be affected.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            {deleteError && (
                                 <div className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md flex items-center">
                                     <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                                     <span>{deleteError}</span>
                                 </div>
                            )}
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    )
}


// --- Main List Component ---
export function CategoryList({ categories }: CategoryListProps) {
    if (!categories || categories.length === 0) {
        return <p className="text-center text-muted-foreground py-4">No categories found.</p>
    }

    return (
        <div className="space-y-3">
            {categories.map((category) => (
                <CategoryItem key={category.id} category={category} />
            ))}
        </div>
    )
}
