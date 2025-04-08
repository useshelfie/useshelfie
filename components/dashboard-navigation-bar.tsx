import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardNavigationBar() {
	// Initialize the Supabase client
	const supabase = await createClient()
	// Fetch the user session
	const {
		data: { session },
	} = await supabase.auth.getSession()
	// Check if the user is authenticated
	const isAuthenticated = !!session
	// If not authenticated, redirect to login page
	if (!isAuthenticated) {
		redirect('/auth/login')
	}
	// If authenticated, return the navigation bar
	// You can customize the navigation bar based on user roles or other criteria
	// For example, you might want to show different links for admin users
	// or regular users. This is just a basic example.
	// You can add more links or customize the styles as needed
	// const user = supabase.auth.user()
	return (
		<nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
			<div className="text-lg font-bold">My App</div>
			<div className="flex items-center space-x-4">
				{isAuthenticated ? (
					<>
						<Link href="/dashboard" className="text-white hover:text-gray-300">
							Dashboard
						</Link>
					</>
				) : (
					<Link href="/auth/login" className="text-white hover:text-gray-300">
						Login
					</Link>
				)}
			</div>
		</nav>
	)
}
