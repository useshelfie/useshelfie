import Link from 'next/link'

export default function NavigationBar() {
	return (
		<nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
			<div className="text-lg font-bold">My App</div>
			<div className="flex items-center space-x-4">
				<Link href="/auth/login">Login</Link>
			</div>
		</nav>
	)
}
