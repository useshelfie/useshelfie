// app/dashboard/products/create/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/forms/product'
import { getCategoriesForCurrentUser } from '@/lib/data/products' // Import function to get categories
import { LogoutButton } from '@/components/logout-button' // Adjust path if needed

export default async function DashboardCreateProductPage() {
	const supabase = await createClient()

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser()
	if (authError || !user) {
		redirect('/login')
	}

	// Fetch categories for the current user server-side
	const userCategories = await getCategoriesForCurrentUser()

	return (
		<div className="flex min-h-svh w-full flex-col items-center justify-start gap-8 p-4 md:p-8">
			{/* User Info Section */}
			{/* <div className="w-full max-w-lg rounded border p-4 shadow-sm dark:border-gray-700">
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Logged in as:{' '}
						<strong className="font-medium text-foreground">
							{user.email}
						</strong>
					</p>
					<LogoutButton />
				</div>
			</div> */}

			{/* Pass fetched categories to the form component */}
			<ProductForm initialCategories={userCategories} />
		</div>
	)
}
