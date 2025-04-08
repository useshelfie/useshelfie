import { notFound } from 'next/navigation'
import { getSellerProfileAndProducts } from '@/lib/data/products'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type Props = {
	params: { user_id: string; product_id: string }
}

// Helper function to format currency (optional)
function formatPrice(price: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(price)
}

export default async function SellerProfileProduct({ params }: Props) {
	const { user_id, product_id } = await params
	const { profile, products } = await getSellerProfileAndProducts(user_id)

	if (!profile) {
		notFound()
	}

	return (
		<div className="container mx-auto mt-10">
			<div>
				<Link
					className="text-blue-500 hover:underline"
					href={`/sellers/${user_id}`}
				>
					return to previous page{' '}
				</Link>
			</div>
			{products
				.filter((product) => product.id === product_id)
				.map((product) => (
					<div>
						<Card key={product.id} className="mb-4">
							<CardHeader>
								<CardTitle>
									{product.name} by {profile.username}
								</CardTitle>
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
						</Card>
					</div>
				))}
		</div>
	)
}
