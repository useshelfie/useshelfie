import { notFound } from 'next/navigation'
import { getProductsByUsername } from '@/lib/data/products'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge' // For displaying categories

type Props = {
	params: { username: string }
}

// Helper function to format currency (optional)
function formatPrice(price: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(price)
}

export default async function SellerProfilePage({ params }: Props) {
	const { username } = params
	const { profile, products } = await getProductsByUsername(username)

	if (!profile) {
		notFound() // Trigger 404 if seller username doesn't exist
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">
				Products by <span className="text-primary">{profile.username}</span>
			</h1>

			{products.length === 0 ? (
				<p className="text-muted-foreground">
					This seller has not listed any products yet.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{products.map((product) => (
						<Card key={product.id}>
							<CardHeader>
								<CardTitle>{product.name}</CardTitle>
								<CardDescription className="pt-1 font-semibold text-lg text-primary">
									{formatPrice(product.price)}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{product.description && (
									<p className="mb-4 text-muted-foreground">
										{product.description}
									</p>
								)}
								{product.categories && product.categories.length > 0 && (
									<div className="flex flex-wrap gap-2">
										<span className="text-sm font-medium">Categories:</span>
										{product.categories.map((category) => (
											<Badge key={category.id} variant="secondary">
												{category.name}
											</Badge>
										))}
									</div>
								)}
							</CardContent>
							{/* No footer/actions needed for public view */}
						</Card>
					))}
				</div>
			)}
		</div>
	)
}

// Optional: Generate static paths if you have a known list of sellers
// export async function generateStaticParams() { ... }
